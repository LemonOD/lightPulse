import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 3) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Google Maps API Key is missing. Fallback to Photon geocoding on client-side.");
    return NextResponse.json({ 
      error: "API_KEY_MISSING",
      predictions: [] 
    });
  }

  try {
    // Biased around Lagos center coords (6.5244, 3.3792) and restricted to Nigeria (country:ng)
    const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&key=${apiKey}&components=country:ng&location=6.5244,3.3792&radius=50000&language=en`;

    const res = await fetch(googleUrl);
    if (!res.ok) {
      throw new Error(`Google Places Autocomplete responded with status ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Google Places Autocomplete Proxy failed:", error);
    return NextResponse.json({ error: "API_ERROR", predictions: [] }, { status: 500 });
  }
}
