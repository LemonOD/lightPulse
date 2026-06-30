"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setUserLocation } from "@/store/slices/appSlice";
import { addLiveAreas, saveCustomAreaThunk } from "@/store/slices/dataSlice";
import { getPreciseLocation, reverseGeocodeCoordinates, fetchLiveNearbyAreasFromOSM, getHaversineDistance } from "@/lib/geolocation";
import { getDeviceId } from "@/lib/device";

export function useAutoLocation() {
  const dispatch = useAppDispatch();
  const areas = useAppSelector((state) => state.data.areas);
  const userLocation = useAppSelector((state) => state.app.userLocation);
  
  // Ref to ensure we only try to geolocate once on mount
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    // Note: We removed `areas.length === 0` from the early return condition 
    // so we CAN seed the first area if the db is empty.
    if (typeof window === "undefined" || !navigator.geolocation || hasAttemptedRef.current || userLocation) return;
    
    // Only attempt if we have loaded areas from DB (even if empty) to avoid race conditions.
    // If state.data.loading is true, maybe wait, but let's assume it has fired or is firing.
    
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

        let lgaName = "Your Exact Location";
        try {
          lgaName = await reverseGeocodeCoordinates(latitude, longitude);
        } catch (e) {
          console.warn("Reverse geocode failed", e);
        }

        // Fetch live actual nearby areas/streets from OpenStreetMap
        const liveAreas = await fetchLiveNearbyAreasFromOSM(latitude, longitude);

        // If the database is completely empty, automatically save the nearest identified OSM area to the database
        // so the user doesn't face an empty "Unknown Location" anxiety.
        if (areas.length === 0 && liveAreas.length > 0) {
          // Find the closest one
          const closestArea = [...liveAreas].sort((a, b) => {
             const distA = getHaversineDistance(latitude, longitude, a.lat, a.lng);
             const distB = getHaversineDistance(latitude, longitude, b.lat, b.lng);
             return distA - distB;
          })[0];
          
          if (closestArea) {
             // Save it to Supabase via Thunk
             dispatch(saveCustomAreaThunk(closestArea));
          }
        }

        const myLocationArea = {
          id: `custom-loc-gps-${getDeviceId()}`,
          name: "My Current Location",
          slug: "my-current-location",
          lat: latitude,
          lng: longitude,
          description: lgaName,
          region: "Custom Location",
        };
        
        // Dispatch custom location and OSM locations to UI state
        dispatch(addLiveAreas([myLocationArea, ...liveAreas]));
      })
      .catch((err) => {
        console.log("Auto-mount geolocator skipped or unauthorized:", err);
      });
  }, [areas.length, dispatch, userLocation]);
}
