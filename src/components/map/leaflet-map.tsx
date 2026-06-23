"use client";

import React from "react";
import LeafletMapImpl from "./leaflet-map-impl";
import GoogleMapImpl from "./google-map-impl";
import { Area, ReportStatus } from "@/lib/types";

interface UnifiedMapProps {
  areas: (Area & { status: ReportStatus })[];
  selectedAreaId: string | null;
  userLocation?: [number, number] | null;
  centerOnUser?: boolean;
}

export default function LeafletMap(props: UnifiedMapProps) {
  // Check if Google Maps public API key is provided on the client side
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleApiKey && googleApiKey.trim() !== "") {
    return <GoogleMapImpl {...props} apiKey={googleApiKey} />;
  }

  // Fallback to Leaflet if API Key is not available in the environment
  return <LeafletMapImpl {...props} />;
}
