import { Area } from "./types";

interface PreciseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToLowAccuracy?: boolean;
}

/**
 * Promise-based geolocator that attempts high accuracy GPS positioning first.
 * Automatically falls back to cell/WiFi network-based coarse geolocating if
 * GPS fails or times out, preventing persistent connection failures.
 */
export function getPreciseLocation(options: PreciseLocationOptions = {}): Promise<[number, number]> {
  const {
    enableHighAccuracy = true,
    timeout = 8000,
    maximumAge = 120000, // 2 minutes cache to avoid constant satellite pings
    fallbackToLowAccuracy = true,
  } = options;

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        // If high accuracy failed and fallback is enabled, try low accuracy immediately
        if (enableHighAccuracy && fallbackToLowAccuracy) {
          console.warn("High accuracy geolocation failed or timed out, trying low accuracy fallback...", error);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve([pos.coords.latitude, pos.coords.longitude]);
            },
            (err) => {
              reject(err);
            },
            {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 300000, // 5 minutes cache for fallback is fine
            }
          );
        } else {
          reject(error);
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  });
}

/**
 * Calculates physical distance in kilometers between two coordinates using the Haversine formula
 */
export const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formats distance in km to a readable string (e.g. "400 m away" or "1.2 km away")
 */
export const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m away`;
  }
  return `${distanceInKm.toFixed(1)} km away`;
};

/**
 * Performs reverse geocoding to resolve a latitude and longitude into a neighborhood or suburb name.
 * Smart hybrid approach:
 * 1. Prioritizes the client-side Google Maps SDK Geocoder if active.
 * 2. Gracefully falls back to OpenStreetMap Nominatim reverse lookup otherwise.
 */
export function reverseGeocodeCoordinates(lat: number, lng: number): Promise<string> {
  return new Promise((resolve) => {
    // 1. Try Google Maps Geocoder if SDK is available
    if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === "OK" && results?.[0]) {
          const components = results[0].address_components || [];
          
          const neighborhood = components.find((c: any) => c.types.includes("neighborhood"));
          const sublocality = components.find((c: any) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1"));
          const locality = components.find((c: any) => c.types.includes("locality"));
          const lga = components.find((c: any) => c.types.includes("administrative_area_level_2"));

          const resolvedName = neighborhood?.long_name || sublocality?.long_name || locality?.long_name || lga?.long_name || "Unknown Location";
          resolve(resolvedName);
        } else {
          console.warn("Google reverse geocoding failed, falling back to OSM Nominatim.", status);
          fetchOSMReverseGeocode(lat, lng).then(resolve);
        }
      });
    } else {
      // 2. OpenStreetMap Nominatim fallback
      fetchOSMReverseGeocode(lat, lng).then(resolve);
    }
  });
}

/**
 * OSM Nominatim Reverse Geocoding helper
 */
async function fetchOSMReverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "LightPulse/1.0"
        }
      }
    );
    if (response.ok) {
      const data = await response.json();
      const address = data.address || {};
      return address.neighbourhood || address.suburb || address.city_district || address.town || address.village || address.road || address.county || address.city || address.country || "Unknown Location";
    }
  } catch (err) {
    console.error("OSM Reverse Geocoding failed:", err);
  }
  return "Unknown Location";
}

/**
 * Fetches live actual nearby areas/estates/streets from OpenStreetMap Nominatim Bounding Box API
 */
export async function fetchLiveNearbyAreasFromOSM(lat: number, lon: number): Promise<Area[]> {
  try {
    // To comply with Nominatim's strict usage policy (1 request/sec), we only query the central point.
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { "User-Agent": "LightPulse/1.0" } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const address = data.address || {};
      const areas: Area[] = [];
      const desc = [address.city || address.county, address.state, address.country].filter(Boolean).join(", ") || "Unknown Location";
      
      const now = Date.now();

      // 1. Precise Street Level
      if (address.road) {
        areas.push({
          id: `live-geom-road-${now}`,
          name: address.road,
          slug: address.road.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          lat: lat,
          lng: lon,
          description: desc,
          region: "Nearby Street"
        });
      }

      // 2. Neighborhood Level
      const nName = address.neighbourhood || address.suburb || address.city_district || address.town || address.village;
      if (nName && nName !== address.road) {
        areas.push({
          id: `live-geom-hood-${now}`,
          name: nName,
          slug: nName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          lat: lat,
          lng: lon,
          description: desc,
          region: "Nearby Neighborhood"
        });
      }
      
      // Fallback if neither exists
      if (areas.length === 0 && address.county) {
         areas.push({
          id: `live-geom-county-${now}`,
          name: address.county,
          slug: address.county.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          lat: lat,
          lng: lon,
          description: desc,
          region: "Nearby Region"
        });
      }

      return areas;
    }


  } catch (osmError) {
    console.error("OSM multi-point reverse geocoding failed:", osmError);
  }
  return [];
}
