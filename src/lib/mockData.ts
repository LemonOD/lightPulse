export interface Area {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  description: string;
  region: string;
}

export type ReportStatus = "stable" | "outage" | "unstable" | "unknown";

export interface Report {
  id: string;
  area_id: string;
  area_name: string;
  status: ReportStatus;
  comment: string;
  created_at: string; // ISO string
  user_id?: string;
  confirmations_count: number;
  has_confirmed?: boolean; // Client flag
}

export interface UptimeHour {
  hour: string; // e.g. "12:00"
  status: ReportStatus;
}

export const INITIAL_AREAS: Area[] = [
  { id: "area-1", name: "Yaba", slug: "yaba", lat: 6.5095, lng: 3.3711, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-2", name: "Sabo", slug: "sabo", lat: 6.5124, lng: 3.3739, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-3", name: "Iwaya", slug: "iwaya", lat: 6.5080, lng: 3.3850, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-4", name: "Surulere", slug: "surulere", lat: 6.5058, lng: 3.3516, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-5", name: "Ojuelegba", slug: "ojuelegba", lat: 6.5158, lng: 3.3592, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-6", name: "Akoka", slug: "akoka", lat: 6.5227, lng: 3.3892, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-7", name: "Ikeja", slug: "ikeja", lat: 6.6018, lng: 3.3515, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-8", name: "Ebute Metta", slug: "ebute-metta", lat: 6.4800, lng: 3.3750, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-9", name: "Egbeda", slug: "egbeda", lat: 6.6111, lng: 3.2833, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-10", name: "Lekki", slug: "lekki", lat: 6.4281, lng: 3.4219, description: "Island, Lagos", region: "Lagos Island" },
  { id: "area-11", name: "Ikoyi", slug: "ikoyi", lat: 6.4549, lng: 3.4308, description: "Island, Lagos", region: "Lagos Island" },
  { id: "area-12", name: "Epe", slug: "epe", lat: 6.5833, lng: 3.9833, description: "Outer District, Lagos", region: "Lagos East" },
  { id: "area-13", name: "Abule Egba", slug: "abule-egba", lat: 6.6575, lng: 3.2797, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-14", name: "Agege", slug: "agege", lat: 6.6186, lng: 3.3204, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-15", name: "Ajah", slug: "ajah", lat: 6.4678, lng: 3.5704, description: "Island, Lagos", region: "Lagos Island" },
  { id: "area-16", name: "Alimosho", slug: "alimosho", lat: 6.6014, lng: 3.2500, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-17", name: "Amuwo Odofin", slug: "amuwo-odofin", lat: 6.4447, lng: 3.2847, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-18", name: "Apapa", slug: "apapa", lat: 6.4384, lng: 3.3644, description: "Port District, Lagos", region: "Lagos West" },
  { id: "area-19", name: "Idumota", slug: "idumota", lat: 6.4589, lng: 3.3939, description: "Island, Lagos", region: "Lagos Island" },
  { id: "area-20", name: "Ifako-Ijaiye", slug: "ifako-ijaiye", lat: 6.6750, lng: 3.3083, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-21", name: "Ikorodu", slug: "ikorodu", lat: 6.6172, lng: 3.5074, description: "Outer District, Lagos", region: "Lagos East" },
  { id: "area-22", name: "Ilasamaja", slug: "ilasamaja", lat: 6.5298, lng: 3.3325, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-23", name: "Isolo", slug: "isolo", lat: 6.5333, lng: 3.3167, description: "Mainland, Lagos", region: "Lagos Mainland" },
  { id: "area-24", name: "Onike", slug: "onike", lat: 6.5076, lng: 3.3768, description: "Mainland, Lagos", region: "Lagos Mainland" }
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: "rep-1",
    area_id: "area-1",
    area_name: "Yaba Central",
    status: "stable",
    comment: "Light is back! Just came on now.",
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    confirmations_count: 12,
    has_confirmed: false
  },
  {
    id: "rep-2",
    area_id: "area-2",
    area_name: "Sabo",
    status: "outage",
    comment: "Power outage since 2 PM. Transformers issues?",
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(), // 14 mins ago
    confirmations_count: 5,
    has_confirmed: false
  },
  {
    id: "rep-3",
    area_id: "area-3",
    area_name: "Alagomeji", // Near Iwaya
    status: "unstable",
    comment: "Low voltage. ACs won't start.",
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32 mins ago
    confirmations_count: 8,
    has_confirmed: false
  },
  {
    id: "rep-4",
    area_id: "area-4",
    area_name: "Surulere",
    status: "outage",
    comment: "Whole grid went down just now. Spiking reports.",
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    confirmations_count: 42,
    has_confirmed: false
  },
  {
    id: "rep-5",
    area_id: "area-7",
    area_name: "Ikeja",
    status: "unstable",
    comment: "Fluctuating between phases, very dangerous.",
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    confirmations_count: 15,
    has_confirmed: false
  }
];

export const MOCK_UPTIME_TRENDS: Record<string, UptimeHour[]> = {
  "Lagos Mainland": [
    { hour: "12am", status: "stable" },
    { hour: "2am", status: "stable" },
    { hour: "4am", status: "stable" },
    { hour: "6am", status: "outage" },
    { hour: "8am", status: "unknown" },
    { hour: "10am", status: "stable" },
    { hour: "12pm", status: "stable" },
    { hour: "2pm", status: "stable" },
    { hour: "4pm", status: "unstable" },
    { hour: "6pm", status: "stable" },
    { hour: "8pm", status: "stable" },
    { hour: "10pm", status: "stable" }
  ],
  "yaba": [
    { hour: "12am", status: "stable" },
    { hour: "2am", status: "stable" },
    { hour: "4am", status: "stable" },
    { hour: "6am", status: "stable" },
    { hour: "8am", status: "stable" },
    { hour: "10am", status: "stable" },
    { hour: "12pm", status: "stable" },
    { hour: "2pm", status: "stable" },
    { hour: "4pm", status: "stable" },
    { hour: "6pm", status: "stable" },
    { hour: "8pm", status: "stable" },
    { hour: "10pm", status: "stable" }
  ],
  "sabo": [
    { hour: "12am", status: "stable" },
    { hour: "2am", status: "stable" },
    { hour: "4am", status: "stable" },
    { hour: "6am", status: "outage" },
    { hour: "8am", status: "outage" },
    { hour: "10am", status: "outage" },
    { hour: "12pm", status: "outage" },
    { hour: "2pm", status: "outage" },
    { hour: "4pm", status: "outage" },
    { hour: "6pm", status: "outage" },
    { hour: "8pm", status: "outage" },
    { hour: "10pm", status: "outage" }
  ]
};
