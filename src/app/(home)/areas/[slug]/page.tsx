import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import AreaClientWrapper from "./client-wrapper";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: area } = await supabase.from("areas").select("name, description").eq("slug", slug).single();
  const areaName = area?.name || slug;
  const areaDesc = area?.description || `Check the real-time electricity and power status in ${areaName}.`;
  
  return {
    title: `Current Power Status in ${areaName} | LightPulse`,
    description: `Community-verified power updates for ${areaName}. ${areaDesc}`,
    openGraph: {
      title: `Current Power Status in ${areaName} | LightPulse`,
      description: `Community-verified power updates for ${areaName}. ${areaDesc}`,
    },
    twitter: {
      title: `Current Power Status in ${areaName} | LightPulse`,
      description: `Community-verified power updates for ${areaName}. ${areaDesc}`,
    }
  };
}

export default async function AreaSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: area } = await supabase.from("areas").select("*").eq("slug", slug).single();
  
  if (!area) {
     return <div className="p-8 text-center text-slate-500">Area not found</div>;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `Power Status Update in ${area.name}`,
    "description": `Real-time community reporting for electricity status in ${area.name}, ${area.region}`,
    "location": {
      "@type": "Place",
      "name": area.name,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": area.lat,
        "longitude": area.lng
      }
    },
    "startDate": new Date().toISOString()
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AreaClientWrapper areaId={area.id} />
    </>
  );
}
