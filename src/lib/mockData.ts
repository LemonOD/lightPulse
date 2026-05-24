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
  // 1. Famous Landmarks & Tertiary Institutions
  { id: "area-1", name: "Yaba Tech", slug: "yaba-tech", lat: 6.5182, lng: 3.3705, description: "Yaba College of Technology, Sabo", region: "Lagos Mainland" },
  { id: "area-2", name: "Sabo Yaba", slug: "sabo-yaba", lat: 6.5124, lng: 3.3739, description: "Sabo Commercial District, Yaba", region: "Lagos Mainland" },
  { id: "area-3", name: "Akoka Finbarrs", slug: "akoka-finbarrs", lat: 6.5180, lng: 3.3850, description: "Residential & School District, Akoka", region: "Lagos Mainland" },
  { id: "area-4", name: "Adeniran Ogunsanya", slug: "adeniran-ogunsanya", lat: 6.4980, lng: 3.3520, description: "Adeniran Ogunsanya Ave, Surulere", region: "Lagos Mainland" },
  { id: "area-5", name: "Ojuelegba Cross", slug: "ojuelegba-cross", lat: 6.5158, lng: 3.3592, description: "Ojuelegba Underbridge, Surulere", region: "Lagos Mainland" },
  { id: "area-6", name: "UNILAG Campus", slug: "unilag-campus", lat: 6.5157, lng: 3.3980, description: "University of Lagos, Akoka", region: "Lagos Mainland" },
  
  // 2. High-Density Commercial & Retail Hubs
  { id: "area-7", name: "Ikeja City Mall", slug: "ikeja-city-mall", lat: 6.6120, lng: 3.3575, description: "Alausa Retail & Government Hub", region: "Lagos Mainland" },
  { id: "area-36", name: "Computer Village", slug: "computer-village", lat: 6.5960, lng: 3.3440, description: "Tech Retail Hub, Ikeja", region: "Lagos Mainland" },
  { id: "area-44", name: "Maryland Mall", slug: "maryland-mall", lat: 6.5680, lng: 3.3700, description: "Anthony/Maryland Commercial Axis", region: "Lagos Mainland" },
  { id: "area-45", name: "Allen Avenue", slug: "allen-avenue", lat: 6.5980, lng: 3.3540, description: "Commercial Avenue, Ikeja", region: "Lagos Mainland" },

  // 3. Premium Residential Estates & Gated Communities
  { id: "area-10", name: "Lekki Phase 1", slug: "lekki-phase-1", lat: 6.4350, lng: 3.4550, description: "Premium Gated Community, Lekki", region: "Lagos Island" },
  { id: "area-37", name: "Chevron Drive", slug: "chevron-drive", lat: 6.4420, lng: 3.5180, description: "Residential & Corporate Axis, Lekki", region: "Lagos Island" },
  { id: "area-38", name: "Banana Island", slug: "banana-island", lat: 6.4670, lng: 3.4500, description: "Luxury Gated Private Estate, Ikoyi", region: "Lagos Island" },
  { id: "area-39", name: "Eko Atlantic", slug: "eko-atlantic", lat: 6.4180, lng: 3.4110, description: "Modern Coastline Peninsula, VI", region: "Lagos Island" },
  { id: "area-46", name: "VGC Estate", slug: "vgc-estate", lat: 6.4610, lng: 3.5280, description: "Victoria Garden City, Lekki", region: "Lagos Island" },
  { id: "area-42", name: "Gbagada Phase 2", slug: "gbagada-phase-2", lat: 6.5540, lng: 3.3820, description: "Secure Residential Estate, Gbagada", region: "Lagos Mainland" },
  { id: "area-43", name: "Magodo Phase 2", slug: "magodo-phase-2", lat: 6.6230, lng: 3.3850, description: "Elite Gated Community, Kosofe", region: "Lagos East" },
  { id: "area-17", name: "Festac Town", slug: "festac-town", lat: 6.4660, lng: 3.2920, description: "Historic Residential Estate, Amuwo", region: "Lagos West" },

  // 4. Detailed Ikorodu Landmarks & Estates (User specific area!)
  { id: "area-21", name: "LASUSTECH Campus", slug: "lasustech-campus", lat: 6.6372, lng: 3.5186, description: "Lagos State University of Sci & Tech", region: "Lagos East" },
  { id: "area-40", name: "Agric Ikorodu", slug: "agric-ikorodu", lat: 6.6124, lng: 3.4862, description: "Agric Residential District, Ikorodu", region: "Lagos East" },
  { id: "area-41", name: "Ikorodu Garage", slug: "ikorodu-garage", lat: 6.6192, lng: 3.5036, description: "Central Terminal & Trade Landmark", region: "Lagos East" },
  { id: "area-49", name: "Ogolonto Ikorodu", slug: "ogolonto-ikorodu", lat: 6.5987, lng: 3.4820, description: "Ogolonto Junction & Residential Area", region: "Lagos East" },
  { id: "area-50", name: "Odogunyan District", slug: "odogunyan-district", lat: 6.6492, lng: 3.5284, description: "Odogunyan Industrial & Residential Hub", region: "Lagos East" },

  // 5. Classic Neighborhood & Regional Hubs
  { id: "area-8", name: "Ebute Metta", slug: "ebute-metta", lat: 6.4800, lng: 3.3750, description: "Historic Neighborhood, Mainland", region: "Lagos Mainland" },
  { id: "area-9", name: "Egbeda", slug: "egbeda", lat: 6.6111, lng: 3.2833, description: "Densely Populated Mainland Hub", region: "Lagos Mainland" },
  { id: "area-11", name: "Ikoyi", slug: "ikoyi", lat: 6.4549, lng: 3.4308, description: "Prestigious Island District", region: "Lagos Island" },
  { id: "area-12", name: "Epe Town", slug: "epe-town", lat: 6.5833, lng: 3.9833, description: "Outer Coastline Fisheries Hub", region: "Lagos East" },
  { id: "area-13", name: "Abule Egba", slug: "abule-egba", lat: 6.6575, lng: 3.2797, description: "Mainland Residential Center", region: "Lagos Mainland" },
  { id: "area-14", name: "Agege", slug: "agege", lat: 6.6186, lng: 3.3204, description: "Mainland Railway Trade Hub", region: "Lagos Mainland" },
  { id: "area-15", name: "Ajah Central", slug: "ajah-central", lat: 6.4678, lng: 3.5704, description: "Island Transportation Intersection", region: "Lagos Island" },
  { id: "area-16", name: "Alimosho", slug: "alimosho", lat: 6.6014, lng: 3.2500, description: "Broad Residential Hub, Mainland", region: "Lagos Mainland" },
  { id: "area-18", name: "Apapa Port", slug: "apapa-port", lat: 6.4384, lng: 3.3644, description: "Maritime Trading & Logistics Port", region: "Lagos West" },
  { id: "area-19", name: "Idumota Market", slug: "idumota-market", lat: 6.4589, lng: 3.3939, description: "Massive Trading Market, Island", region: "Lagos Island" },
  { id: "area-20", name: "Ifako-Ijaiye", slug: "ifako-ijaiye", lat: 6.6750, lng: 3.3083, description: "Mainland Residential LGA Boundary", region: "Lagos Mainland" },
  { id: "area-22", name: "Ilasamaja", slug: "ilasamaja", lat: 6.5298, lng: 3.3325, description: "Mainland Residential & Industrial Axis", region: "Lagos Mainland" },
  { id: "area-23", name: "Isolo", slug: "isolo", lat: 6.5333, lng: 3.3167, description: "Residential District, Mainland", region: "Lagos Mainland" },
  { id: "area-24", name: "Onike Yaba", slug: "onike-yaba", lat: 6.5076, lng: 3.3768, description: "Mainland Residential Close to UNILAG", region: "Lagos Mainland" },
  { id: "area-25", name: "Mile 12 Market", slug: "mile-12-market", lat: 6.6020, lng: 3.3980, description: "Major Agricultural Trade Hub", region: "Lagos East" },
  { id: "area-26", name: "Mushin", slug: "mushin", lat: 6.5294, lng: 3.3422, description: "Mainland Commercial Hub", region: "Lagos Mainland" },
  { id: "area-27", name: "Shomolu", slug: "shomolu", lat: 6.5385, lng: 3.3854, description: "Mainland Printing & Publishing Hub", region: "Lagos Mainland" },
  { id: "area-28", name: "Badagry Town", slug: "badagry-town", lat: 6.4316, lng: 2.8876, description: "Historic Border Coastline Hub", region: "Lagos West" },
  { id: "area-29", name: "Ajeromi Hub", slug: "ajah-central", lat: 6.4527, lng: 3.3328, description: "Densely Populated West Coastline Hub", region: "Lagos West" },
  { id: "area-30", name: "Ojo Town", slug: "ojo-town", lat: 6.4673, lng: 3.1812, description: "Trade & Higher Education Campus", region: "Lagos West" },
  { id: "area-31", name: "Sangotedo", slug: "sangotedo", lat: 6.4650, lng: 3.6010, description: "Rapidly Expanding Gated Communities", region: "Lagos East" },
  { id: "area-32", name: "Oshodi Interchange", slug: "oshodi-interchange", lat: 6.5333, lng: 3.3167, description: "Massive Mainland Transit Terminal", region: "Lagos Mainland" },
  { id: "area-33", name: "Lagos Island Central", slug: "lagos-island-central", lat: 6.4549, lng: 3.3947, description: "Commercial Core & Bank Offices", region: "Lagos Island" },
  { id: "area-34", name: "Lagos Mainland Axis", slug: "lagos-mainland-axis", lat: 6.5095, lng: 3.3711, description: "Central Residential Mainland Hub", region: "Lagos Mainland" },
  { id: "area-35", name: "Eti-Osa Coast", slug: "eti-osa-coast", lat: 6.4326, lng: 3.4475, description: "Premium Coastline Gated Suburbs", region: "Lagos Island" }
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: "rep-1",
    area_id: "area-1",
    area_name: "Yaba Tech",
    status: "stable",
    comment: "Light is back! Just came on now.",
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    confirmations_count: 12,
    has_confirmed: false
  },
  {
    id: "rep-2",
    area_id: "area-2",
    area_name: "Sabo Yaba",
    status: "outage",
    comment: "Power outage since 2 PM. Transformers issues?",
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(), // 14 mins ago
    confirmations_count: 5,
    has_confirmed: false
  },
  {
    id: "rep-3",
    area_id: "area-3",
    area_name: "Akoka Finbarrs",
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
    area_name: "Ikeja City Mall",
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
