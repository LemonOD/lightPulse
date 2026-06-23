export type ReportStatus = "LIGHT_AVAILABLE" | "LIGHT_OUT" | "LOW_VOLTAGE" | "UNKNOWN";

export interface Area {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  description: string;
  region: string;
  current_status?: ReportStatus;
  last_reported_at?: string;
}

export interface Report {
  id: string;
  area_id: string;
  area_name: string;
  status: ReportStatus;
  comment: string;
  latitude?: number;
  longitude?: number;
  created_at: string; // ISO string
  device_id: string;
  expires_at: string; // ISO string
  confidence_score: number;
  has_confirmed?: boolean; // Client flag
}

export interface UptimeHour {
  hour: string; // e.g. "12pm"
  status: ReportStatus;
}

// UI Mapper helper
export function getDisplayStatus(status: ReportStatus | string): string {
  switch (status) {
    case "LIGHT_AVAILABLE":
      return "⚡ Light Available";
    case "LIGHT_OUT":
      return "🚫 Light Out";
    case "LOW_VOLTAGE":
      return "⚠️ Low Voltage";
    default:
      return "Unknown";
  }
}
