import { supabase } from "./supabase";
import { Area, Report, ReportStatus } from "./types";
import { getDeviceId } from "./device";
import { normalizeAreaToH3 } from "./h3-utils";

// Define a standard service interface
export interface IDatabaseService {
  getAreas(): Promise<Area[]>;
  getReports(): Promise<Report[]>;
  getHistoricalReports(areaId: string, days: number): Promise<Report[]>;
  createReport(report: Omit<Report, "id" | "created_at" | "confidence_score" | "device_id" | "expires_at">): Promise<Report>;
  confirmReport(reportId: string): Promise<number>;
  saveCustomArea(area: Area): Promise<void>;
}

export function isReportExpired(report: Report | { expires_at: string }): boolean {
  return new Date(report.expires_at).getTime() < Date.now();
}

/**
 * Area Status Aggregation Engine
 */
export async function calculateAreaStatus(areaId: string): Promise<void> {
  const now = new Date().toISOString();
  
  const { data: activeReports, error } = await supabase
    .from("reports")
    .select("status, created_at")
    .eq("area_id", areaId)
    .gt("expires_at", now);

  if (error || !activeReports || activeReports.length === 0) {
    await supabase.from("areas").update({
      current_status: "UNKNOWN",
    }).eq("id", areaId);
    return;
  }

  // Power states flip instantly. We must prioritize the most recent chronologically valid report.
  // Sort descending by date to get the latest report
  activeReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const latestReport = activeReports[0];

  await supabase.from("areas").update({
    current_status: latestReport.status,
    last_reported_at: latestReport.created_at
  }).eq("id", areaId);
}


class SupabaseDatabaseService implements IDatabaseService {
  async getAreas(): Promise<Area[]> {
    const { data, error } = await supabase
      .from("areas")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      console.error("Error fetching areas from Supabase:", error);
      return [];
    }
    return data || [];
  }

  async getReports(): Promise<Report[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("reports")
      .select(`
        id,
        area_id,
        area:areas(name),
        status,
        comment,
        latitude,
        longitude,
        created_at,
        device_id,
        expires_at,
        confidence_score
      `)
      .gt("created_at", oneDayAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports from Supabase:", error);
      return [];
    }

    const deviceId = getDeviceId();

    // Map fields
    const formattedReports: Report[] = [];
    
    // Concurrently fetch confirmations to set 'has_confirmed' for the current device
    const { data: myConfirmations } = await supabase
      .from("confirmations")
      .select("report_id")
      .eq("device_id", deviceId);
      
    const confirmedSet = new Set(myConfirmations?.map(c => c.report_id) || []);

    for (const item of (data as any[])) {
      formattedReports.push({
        id: item.id,
        area_id: item.area_id,
        area_name: item.area?.name || "Unknown Area",
        status: item.status as ReportStatus,
        comment: item.comment || "",
        latitude: item.latitude,
        longitude: item.longitude,
        created_at: item.created_at,
        device_id: item.device_id,
        expires_at: item.expires_at,
        confidence_score: item.confidence_score || 1,
        has_confirmed: confirmedSet.has(item.id)
      });
    }

    return formattedReports;
  }

  async getHistoricalReports(areaId: string, days: number): Promise<Report[]> {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);
    const dateString = pastDate.toISOString();

    const { data, error } = await supabase
      .from("reports")
      .select(`
        id,
        area_id,
        area:areas(name),
        status,
        comment,
        latitude,
        longitude,
        created_at,
        device_id,
        expires_at,
        confidence_score
      `)
      .eq("area_id", areaId)
      .gt("created_at", dateString)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching historical reports:", error);
      return [];
    }

    const formattedReports: Report[] = [];
    for (const item of (data as any[])) {
      formattedReports.push({
        id: item.id,
        area_id: item.area_id,
        area_name: item.area?.name || "Unknown Area",
        status: item.status as ReportStatus,
        comment: item.comment || "",
        latitude: item.latitude,
        longitude: item.longitude,
        created_at: item.created_at,
        device_id: item.device_id,
        expires_at: item.expires_at,
        confidence_score: item.confidence_score || 1,
      });
    }

    return formattedReports;
  }

  async createReport(newReportData: Omit<Report, "id" | "created_at" | "confidence_score" | "device_id" | "expires_at">): Promise<Report> {
    const deviceId = getDeviceId();
    
    // Calculate expiration
    const now = Date.now();
    let expiresMs = now;
    if (newReportData.status === "LIGHT_OUT") expiresMs += 2 * 60 * 60 * 1000;
    else if (newReportData.status === "LOW_VOLTAGE") expiresMs += 1 * 60 * 60 * 1000;
    else if (newReportData.status === "LIGHT_AVAILABLE") expiresMs += 3 * 60 * 60 * 1000;
    else expiresMs += 2 * 60 * 60 * 1000;

    const expiresAt = new Date(expiresMs).toISOString();

    const insertPayload: any = {
      area_id: newReportData.area_id,
      status: newReportData.status,
      device_id: deviceId,
      expires_at: expiresAt,
    };
    
    if (newReportData.comment) insertPayload.comment = newReportData.comment;
    if (newReportData.latitude) insertPayload.latitude = newReportData.latitude;
    if (newReportData.longitude) insertPayload.longitude = newReportData.longitude;

    // Invoke the Deno Edge Function for Real-time Intelligence & Fraud Prevention
    const { data, error } = await supabase.functions.invoke('process-report', {
      body: insertPayload
    });

    if (error) {
      console.error("Supabase edge function invocation error details:", error);
      // Attempt to read the raw JSON error body returned by our Deno edge function
      if (error.context) {
        try {
          const errBody = await error.context.json();
          console.error("Parsed Edge Function Error:", errBody);
          throw new Error(errBody.error || "Edge function failed");
        } catch (e) {
          // Fallback if it's not valid JSON
          throw error;
        }
      }
      throw error;
    }

    if (data.error) {
      throw new Error(data.error);
    }

    const createdReport = data.report;

    return {
      id: createdReport.id,
      area_id: createdReport.area_id,
      area_name: newReportData.area_name || "Unknown Area", // Use requested name
      status: createdReport.status as ReportStatus,
      comment: createdReport.comment || "",
      latitude: createdReport.latitude,
      longitude: createdReport.longitude,
      created_at: createdReport.created_at,
      device_id: createdReport.device_id,
      expires_at: createdReport.expires_at,
      confidence_score: createdReport.confidence_score,
      has_confirmed: true // We can assume the user confirmed their own newly created or clustered report
    };
  }

  async confirmReport(reportId: string): Promise<number> {
    const deviceId = getDeviceId();

    // 1. Fetch report to check existence and current confidence score
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("area_id, confidence_score")
      .eq("id", reportId)
      .single();
      
    if (reportError || !report) return 0;

    // 2. Insert confirmation. Because of UNIQUE(report_id, device_id), duplicates will fail.
    const { error: insertError } = await supabase
      .from("confirmations")
      .insert({
        report_id: reportId,
        device_id: deviceId
      });

    // Code 23505 = unique violation. If so, they already confirmed, just return the current score.
    if (insertError) {
      if (insertError.code === '23505') return report.confidence_score;
      console.error("Failed to add confirmation:", insertError);
      return report.confidence_score;
    }

    // 3. Increment confidence_score on the report table
    const newScore = (report.confidence_score || 1) + 1;
    await supabase
      .from("reports")
      .update({ confidence_score: newScore })
      .eq("id", reportId);

    // 4. Trigger aggregation engine
    calculateAreaStatus(report.area_id).catch(console.error);

    return newScore;
  }

  async saveCustomArea(area: Area): Promise<void> {
    const normalizedArea = normalizeAreaToH3(area);
    const { error } = await supabase
      .from("areas")
      .upsert({
        id: normalizedArea.id,
        name: normalizedArea.name,
        slug: normalizedArea.slug,
        lat: normalizedArea.lat,
        lng: normalizedArea.lng,
        region: normalizedArea.region,
        description: normalizedArea.description
      });

    if (error) {
      console.error("Failed to save custom area to Supabase:", error);
    }
  }
}

export const dbService: IDatabaseService = new SupabaseDatabaseService();

/**
 * Utility helper to compute the current dynamic power status of an area locally
 */
export function getAreaStatusFromReports(areaId: string, reports: Report[]): ReportStatus {
  const activeReports = reports.filter(r => r.area_id === areaId && !isReportExpired(r));
  if (activeReports.length === 0) return "UNKNOWN";

  // Power states flip instantly. We must prioritize the most recent chronologically valid report.
  // Sort descending by date
  activeReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return activeReports[0].status;
}
