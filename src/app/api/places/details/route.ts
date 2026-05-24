import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Google Maps API Key is missing for Place Details.");
    return NextResponse.json({ error: "API_KEY_MISSING" }, { status: 400 });
  }

  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${apiKey}`;

    const res = await fetch(googleUrl);
    if (!res.ok) {
      throw new Error(`Google Place Details responded with status ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Google Place Details Proxy failed:", error);
    return NextResponse.json({ error: "API_ERROR" }, { status: 500 });
  }
}
