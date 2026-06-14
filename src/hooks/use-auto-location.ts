"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setUserLocation } from "@/store/slices/appSlice";
import { addLiveAreas } from "@/store/slices/dataSlice";
import { getPreciseLocation, reverseGeocodeCoordinates, fetchLiveNearbyAreasFromOSM } from "@/lib/geolocation";

export function useAutoLocation() {
  const dispatch = useAppDispatch();
  const areas = useAppSelector((state) => state.data.areas);
  const userLocation = useAppSelector((state) => state.app.userLocation);
  
  // Ref to ensure we only try to geolocate once on mount if areas are loaded
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation || areas.length === 0 || hasAttemptedRef.current || userLocation) return;
    
    hasAttemptedRef.current = true;

    getPreciseLocation({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 120000,
      fallbackToLowAccuracy: true
    })
      .then(async ([latitude, longitude]) => {
        const coords: [number, number] = [latitude, longitude];

        // Store location coordinates globally in Redux
        dispatch(setUserLocation(coords));

        // Smart hybrid reverse geocoding
        let lgaName = "Your Exact Location";
        try {
          lgaName = await reverseGeocodeCoordinates(latitude, longitude);
        } catch (e) {
          console.warn("Reverse geocode failed", e);
        }

        const myLocationArea = {
          id: `custom-loc-gps`,
          name: "My Current Location",
          slug: "my-current-location",
          lat: latitude,
          lng: longitude,
          description: lgaName,
          region: "Custom Location",
        };

        // Fetch live actual nearby areas/streets from OpenStreetMap to place them on the map
        const liveAreas = await fetchLiveNearbyAreasFromOSM(latitude, longitude);
        
        // Dispatch custom location and OSM locations
        dispatch(addLiveAreas([myLocationArea, ...liveAreas]));
      })
      .catch((err) => {
        console.log("Auto-mount geolocator skipped or unauthorized:", err);
      });
  }, [areas, dispatch, userLocation]);
}
