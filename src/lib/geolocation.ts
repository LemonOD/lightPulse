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
          
          // In Lagos, prioritize: Neighborhood -> Sublocality -> Locality -> LGA -> State
          const neighborhood = components.find((c: any) => c.types.includes("neighborhood"));
          const sublocality = components.find((c: any) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1"));
          const locality = components.find((c: any) => c.types.includes("locality"));
          const lga = components.find((c: any) => c.types.includes("administrative_area_level_2"));

          const resolvedName = neighborhood?.long_name || sublocality?.long_name || locality?.long_name || lga?.long_name || "Lagos";
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
          "User-Agent": "LytPulse/1.0"
        }
      }
    );
    if (response.ok) {
      const data = await response.json();
      const address = data.address || {};
      return address.county || address.city_district || address.suburb || address.neighbourhood || address.city || "Lagos";
    }
  } catch (err) {
    console.error("OSM Reverse Geocoding failed:", err);
  }
  return "Lagos";
}

/**
 * Fetches live actual nearby areas/estates/streets from OpenStreetMap Nominatim Bounding Box API
 */
export async function fetchLiveNearbyAreasFromOSM(lat: number, lon: number): Promise<Area[]> {
  try {
    const minLat = lat - 0.015;
    const maxLat = lat + 0.015;
    const minLon = lon - 0.015;
    const maxLon = lon + 0.015;

    const osmUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1&q=street+estate+market+school+plaza+hospital+mall&limit=8`;
    
    const response = await fetch(osmUrl, {
      headers: {
        "User-Agent": "LytPulse/1.0"
      }
    });

    if (response.ok) {
      const osmData = await response.json();
      
      if (Array.isArray(osmData) && osmData.length > 0) {
        interface OSMPlaceItem {
          place_id: number;
          name?: string;
          display_name: string;
          lat: string;
          lon: string;
        }

        return osmData.map((item: OSMPlaceItem) => {
          const displayNameParts = item.display_name.split(",");
          const name = item.name || displayNameParts[0];
          const desc = displayNameParts.slice(1, 4).join(",").trim() || "Lagos, Nigeria";
          
          return {
            id: `live-${item.place_id}`,
            name: name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            description: desc,
            region: "Near You (GPS Live)"
          };
        });
      }
    }
  } catch (osmError) {
    console.error("OSM Bounding Box search failed:", osmError);
  }
  return [];
}
