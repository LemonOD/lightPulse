/**
 * Location Memory Helpers
 *
 * These utilities implement a "GPS-anchored sticky area" pattern:
 * - When a user actively reports from an area, we save it as their "home area".
 * - On the next app load, we get GPS and check if they're still nearby.
 *   If yes → restore the saved area. If no → auto-detect the nearest area.
 * - This means the app "remembers" a user's area if they're still around it,
 *   and automatically updates if they've moved.
 */

const HOME_AREA_ID_KEY  = "lightpulse_home_area_id";
const HOME_AREA_LAT_KEY = "lightpulse_home_area_lat";
const HOME_AREA_LNG_KEY = "lightpulse_home_area_lng";

/** Radius in km within which we consider the user "still at" their saved area */
const HOME_AREA_RADIUS_KM = 1;

export interface SavedHomeArea {
  id: string;
  lat: number;
  lng: number;
}

/** Save the user's actively-reported area as their "home area". */
export function saveHomeArea(id: string, lat: number, lng: number): void {
  try {
    localStorage.setItem(HOME_AREA_ID_KEY,  id);
    localStorage.setItem(HOME_AREA_LAT_KEY, lat.toString());
    localStorage.setItem(HOME_AREA_LNG_KEY, lng.toString());
  } catch {}
}

/** Load the previously saved home area, or null if none exists. */
export function loadHomeArea(): SavedHomeArea | null {
  try {
    const id  = localStorage.getItem(HOME_AREA_ID_KEY);
    const lat = parseFloat(localStorage.getItem(HOME_AREA_LAT_KEY) ?? "");
    const lng = parseFloat(localStorage.getItem(HOME_AREA_LNG_KEY) ?? "");
    if (id && !isNaN(lat) && !isNaN(lng)) return { id, lat, lng };
  } catch {}
  return null;
}

/** Clear the saved home area (e.g., when user manually resets). */
export function clearHomeArea(): void {
  try {
    localStorage.removeItem(HOME_AREA_ID_KEY);
    localStorage.removeItem(HOME_AREA_LAT_KEY);
    localStorage.removeItem(HOME_AREA_LNG_KEY);
  } catch {}
}

/**
 * Decide which area to activate on app load.
 *
 * Strategy:
 * 1. Try to get the current GPS position.
 * 2. If GPS succeeds:
 *    a. If a home area is saved AND the user is within HOME_AREA_RADIUS_KM → use it.
 *    b. Otherwise → auto-detect via the provided detector function.
 * 3. If GPS fails → fall back to the saved home area (if any).
 *
 * Returns the area ID to activate, or null if nothing could be resolved.
 */
export async function resolveStartupArea(
  currentGPS: [number, number] | null,
  haversineDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number,
): Promise<{ areaId: string | null; shouldAutoDetect: boolean; gpsCoords: [number, number] | null }> {
  const homeArea = loadHomeArea();

  // GPS is available
  if (currentGPS) {
    const [lat, lng] = currentGPS;

    // Check if user is still near their saved home area
    if (homeArea) {
      const distKm = haversineDistance(lat, lng, homeArea.lat, homeArea.lng);
      if (distKm <= HOME_AREA_RADIUS_KM) {
        // User is still nearby → keep the saved area
        return { areaId: homeArea.id, shouldAutoDetect: false, gpsCoords: currentGPS };
      }
    }

    // User has moved or has no saved area → trigger full auto-detect
    return { areaId: null, shouldAutoDetect: true, gpsCoords: currentGPS };
  }

  // GPS unavailable — fall back to saved home area silently
  if (homeArea) {
    return { areaId: homeArea.id, shouldAutoDetect: false, gpsCoords: null };
  }

  // Nothing to go on — let the caller decide on a global fallback
  return { areaId: null, shouldAutoDetect: false, gpsCoords: null };
}
