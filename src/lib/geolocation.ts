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

          const route = components.find((c: any) => c.types.includes("route"));
          const neighborhood = components.find((c: any) => c.types.includes("neighborhood"));
          const sublocality = components.find((c: any) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1"));
          const locality = components.find((c: any) => c.types.includes("locality"));
          const lga = components.find((c: any) => c.types.includes("administrative_area_level_2"));

          const resolvedName = route?.long_name || neighborhood?.long_name || sublocality?.long_name || locality?.long_name || lga?.long_name || "Unknown Location";
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
      // Strict priority list, aggressively filtering out false-positives like 'ajebo'
      const candidates = [
        address.neighbourhood,
        address.quarter,
        address.hamlet,
        address.suburb,
        address.city_district,
        address.borough,
        address.district,
        address.village,
        address.town,
        address.city,
        address.municipality,
        address.county,
        address.state_district,
        address.road,
        address.country
      ];

      const validName = candidates.find(c => c && typeof c === 'string' && c.toLowerCase() !== "ajebo");
      return validName || "Unknown Location";
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
  const now = Date.now();
  const areas: Area[] = [];

  // 1. Try Google Maps Geocoder if SDK is available (Much more accurate for Nigeria)
  if (typeof window !== "undefined" && (window as any).google?.maps?.Geocoder) {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      const result: any = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng: lon } }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) resolve(results[0]);
          else reject(status);
        });
      });

      const components = result.address_components || [];
      const route = components.find((c: any) => c.types.includes("route"));
      const neighborhood = components.find((c: any) => c.types.includes("neighborhood"));
      const sublocality = components.find((c: any) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1"));
      const locality = components.find((c: any) => c.types.includes("locality"));

      const desc = [locality?.long_name, "Nigeria"].filter(Boolean).join(", ");

      if (route?.long_name) {
        areas.push({
          id: `live-geom-road-${now}`,
          name: route.long_name,
          slug: route.long_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          lat, lng: lon,
          description: desc,
          region: "Nearby Street"
        });
      }

      const nName = neighborhood?.long_name || sublocality?.long_name;
      if (nName && nName !== route?.long_name) {
        areas.push({
          id: `live-geom-hood-${now}`,
          name: nName,
          slug: nName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          lat, lng: lon,
          description: desc,
          region: "Nearby Neighborhood"
        });
      }

      if (areas.length > 0) return areas;
    } catch (e) {
      console.warn("Google Maps nearby areas extraction failed, falling back to OSM", e);
    }
  }

  // 2. OpenStreetMap Nominatim fallback
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { "User-Agent": "LightPulse/1.0" } }
    );

    if (response.ok) {
      const data = await response.json();
      const address = data.address || {};
      const desc = [address.city || address.state, address.country].filter(Boolean).join(", ") || "Unknown Location";

      if (address.road && address.road.toLowerCase() !== "ajebo") {
        areas.push({
          id: `live-geom-road-${now}`,
          name: address.road,
          slug: address.road.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          lat, lng: lon,
          description: desc,
          region: "Nearby Street"
        });
      }

      const nName = address.neighbourhood || address.suburb || address.city_district || address.town || address.village;
      if (nName && nName !== address.road && nName.toLowerCase() !== "ajebo") {
        areas.push({
          id: `live-geom-hood-${now}`,
          name: nName,
          slug: nName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          lat, lng: lon,
          description: desc,
          region: "Nearby Neighborhood"
        });
      }

      if (areas.length === 0 && address.county && address.county.toLowerCase() !== "ajebo") {
        areas.push({
          id: `live-geom-county-${now}`,
          name: address.county,
          slug: address.county.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          lat, lng: lon,
          description: desc,
          region: "Nearby Region"
        });
      }

      if (areas.length === 0 && (address.city || address.state)) {
        const fallbackName = address.city || address.state;
        if (fallbackName.toLowerCase() !== "ajebo") {
          areas.push({
            id: `live-geom-city-${now}`,
            name: fallbackName,
            slug: fallbackName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            lat, lng: lon,
            description: desc,
            region: "Nearby Region"
          });
        }
      }

      return areas;
    }
  } catch (osmError) {
    console.error("OSM multi-point reverse geocoding failed:", osmError);
  }
  return [];
}
