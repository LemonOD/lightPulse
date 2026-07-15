import { latLngToCell, cellToLatLng } from "h3-js";
import { Area } from "./types";

export const H3_RESOLUTION = 8; // Approx 0.73 km^2 per hex, good for neighborhoods

/**
 * Converts a latitude and longitude to an H3 index (hex string)
 */
export function getH3Index(lat: number, lng: number): string {
  return latLngToCell(lat, lng, H3_RESOLUTION);
}

/**
 * Gets the center coordinates of an H3 hexagon
 */
export function getH3Center(h3Index: string): { lat: number; lng: number } {
  const [lat, lng] = cellToLatLng(h3Index);
  return { lat, lng };
}

/**
 * Normalizes a custom Area object so that its ID, latitude, and longitude
 * snap to the nearest H3 hexagon center.
 */
export function normalizeAreaToH3(area: Area): Area {
  if (area.id && !area.id.startsWith("custom-") && !area.id.startsWith("osm-") && !area.id.startsWith("live-") && !area.id.startsWith("search-")) {
    // If it's a predefined static area (not user generated), return as is
    return area;
  }

  const h3Index = getH3Index(area.lat, area.lng);
  const center = getH3Center(h3Index);

  return {
    ...area,
    id: `hex-${h3Index}`,
    lat: center.lat,
    lng: center.lng,
    // Note: We might want to keep the original name they provided,
    // or append the H3 index to make it somewhat unique if it was a generic "Custom Area".
  };
}
