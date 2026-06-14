import { supabase, isSupabaseConfigured } from "./supabase";
import { Area, Report, ReportStatus, INITIAL_AREAS, INITIAL_REPORTS } from "./mockData";

// Define a standard service interface
export interface IDatabaseService {
  getAreas(): Promise<Area[]>;
  getReports(): Promise<Report[]>;
  createReport(report: Omit<Report, "id" | "created_at" | "confirmations_count">): Promise<Report>;
  confirmReport(reportId: string): Promise<number>;
  saveCustomArea(area: Area): Promise<void>;
}

// Local Storage / In-Memory Mock Implementation
export function getClientUserId(): string {
  if (typeof window === "undefined") return "server-user";
  let userId = localStorage.getItem("lytpulse_user_id");
  if (!userId) {
    userId = `usr-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("lytpulse_user_id", userId);
  }
  return userId;
}

class MockDatabaseService implements IDatabaseService {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private setStorageItem<T>(key: string, value: T): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  private initDatabase() {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("lytpulse_areas")) {
      this.setStorageItem("lytpulse_areas", INITIAL_AREAS);
    }
    if (!localStorage.getItem("lytpulse_reports")) {
      this.setStorageItem("lytpulse_reports", INITIAL_REPORTS);
    }
  }

  constructor() {
    this.initDatabase();
  }

  async getAreas(): Promise<Area[]> {
    return this.getStorageItem<Area[]>("lytpulse_areas", INITIAL_AREAS);
  }

  async getReports(): Promise<Report[]> {
    const reports = this.getStorageItem<Report[]>("lytpulse_reports", INITIAL_REPORTS);
    // Sort reverse-chronologically
    return reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createReport(newReportData: Omit<Report, "id" | "created_at" | "confirmations_count">): Promise<Report> {
    const reports = this.getStorageItem<Report[]>("lytpulse_reports", INITIAL_REPORTS);
    const newReport: Report = {
      ...newReportData,
      user_id: newReportData.user_id || getClientUserId(),
      id: `rep-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      confirmations_count: 0,
      has_confirmed: false
    };

    reports.push(newReport);
    this.setStorageItem("lytpulse_reports", reports);
    return newReport;
  }

  async confirmReport(reportId: string): Promise<number> {
    const reports = this.getStorageItem<Report[]>("lytpulse_reports", INITIAL_REPORTS);
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
      const confirmedReport = reports[reportIndex];
      
      // Enforce: Reporter cannot confirm their own report
      if (confirmedReport.user_id === getClientUserId()) {
        return confirmedReport.confirmations_count;
      }
      
      if (!confirmedReport.has_confirmed) {
        confirmedReport.confirmations_count += 1;
        confirmedReport.has_confirmed = true;
        
        // Synchronize all similar reports in the same neighborhood showing the same status
        reports.forEach((r) => {
          if (
            r.id !== confirmedReport.id && 
            r.area_id === confirmedReport.area_id && 
            r.status === confirmedReport.status
          ) {
            r.confirmations_count += 1;
            r.has_confirmed = true;
          }
        });

        this.setStorageItem("lytpulse_reports", reports);
      }
      return confirmedReport.confirmations_count;
    }
    return 0;
  }

  async saveCustomArea(area: Area): Promise<void> {
    const areas = this.getStorageItem<Area[]>("lytpulse_areas", INITIAL_AREAS);
    const existingIndex = areas.findIndex(a => a.id === area.id);
    if (existingIndex !== -1) {
      areas[existingIndex] = area;
    } else {
      areas.push(area);
    }
    this.setStorageItem("lytpulse_areas", areas);
  }
}

// Live Supabase Client Implementation
class SupabaseDatabaseService implements IDatabaseService {
  async getAreas(): Promise<Area[]> {
    const { data, error } = await supabase
      .from("areas")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      console.error("Error fetching areas from Supabase, falling back to initial data:", error);
      return INITIAL_AREAS;
    }
    return data || INITIAL_AREAS;
  }

  async getReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from("reports")
      .select(`
        id,
        area_id,
        area:areas(name),
        status,
        comment,
        created_at,
        user_id
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports from Supabase, falling back:", error);
      return INITIAL_REPORTS;
    }

    // Map fields from Supabase to Report schema
    const formattedReports: Report[] = (data as unknown as {
      id: string;
      area_id: string;
      area: { name: string } | null;
      status: string;
      comment: string | null;
      created_at: string;
      user_id?: string;
    }[] || []).map((item) => ({
      id: item.id,
      area_id: item.area_id,
      area_name: item.area?.name || "Unknown Area",
      status: item.status as ReportStatus,
      comment: item.comment || "",
      created_at: item.created_at,
      user_id: item.user_id,
      confirmations_count: 0, // In production, loaded via subqueries or joins
      has_confirmed: false
    }));

    // Load confirmations count
    for (const r of formattedReports) {
      const { count } = await supabase
        .from("confirmations")
        .select("*", { count: "exact", head: true })
        .eq("report_id", r.id);
      r.confirmations_count = count || 0;
    }

    return formattedReports;
  }

  async createReport(newReportData: Omit<Report, "id" | "created_at" | "confirmations_count">): Promise<Report> {
    const { data, error } = await supabase
      .from("reports")
      .insert({
        area_id: newReportData.area_id,
        status: newReportData.status,
        comment: newReportData.comment,
        user_id: newReportData.user_id || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }

    // Get area name
    const { data: areaData } = await supabase
      .from("areas")
      .select("name")
      .eq("id", newReportData.area_id)
      .single();

    return {
      id: data.id,
      area_id: data.area_id,
      area_name: areaData?.name || "Unknown Area",
      status: data.status as ReportStatus,
      comment: data.comment || "",
      created_at: data.created_at,
      user_id: data.user_id,
      confirmations_count: 0,
      has_confirmed: false
    };
  }

  async confirmReport(reportId: string): Promise<number> {
    const { error: insertError } = await supabase
      .from("confirmations")
      .insert({
        report_id: reportId
      });

    if (insertError) {
      console.error("Failed to add confirmation:", insertError);
    }

    const { count, error } = await supabase
      .from("confirmations")
      .select("*", { count: "exact", head: true })
      .eq("report_id", reportId);

    if (error) {
      console.error("Failed to get confirmations count:", error);
      return 0;
    }

    return count || 0;
  }

  async saveCustomArea(area: Area): Promise<void> {
    const { error } = await supabase
      .from("areas")
      .upsert({
        id: area.id,
        name: area.name,
        slug: area.slug,
        lat: area.lat,
        lng: area.lng,
        region: area.region,
        description: area.description
      });

    if (error) {
      console.error("Failed to save custom area to Supabase:", error);
    }
  }
}

// Instantiate the active service based on config
export const dbService: IDatabaseService = isSupabaseConfigured
  ? new SupabaseDatabaseService()
  : new MockDatabaseService();

/**
 * Utility helper to compute the current dynamic power status of an area
 * based on its recent reports. If there's a report in the last 6 hours,
 * it adopts that status. Otherwise, it defaults to 'unknown'.
 */
export function getAreaStatusFromReports(areaId: string, reports: Report[]): ReportStatus {
  const areaReports = reports.filter(r => r.area_id === areaId);
  if (areaReports.length === 0) return "unknown";

  // Sort by date descending
  const sorted = [...areaReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const latest = sorted[0];

  // If latest report is within last 12 hours, use its status. Otherwise, treat as unknown.
  const diffHours = (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60);
  if (diffHours < 12) {
    return latest.status;
  }
  
  return "unknown";
}
