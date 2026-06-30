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
    // We fetch the location silently. This will trigger the browser permission prompt if they haven't allowed it yet.
    if (typeof window === "undefined" || !navigator.geolocation || hasAttemptedRef.current || userLocation) return;
    
    hasAttemptedRef.current = true;
    
    getPreciseLocation({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 120000,
      fallbackToLowAccuracy: true
    })
      .then(async ([latitude, longitude]) => {
        const coords: [number, number] = [latitude, longitude];

        // Store location coordinates globally in Redux for precise reporting distance calcs
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
        if (areas.length === 0 && liveAreas.length > 0) {
          const closestArea = [...liveAreas].sort((a, b) => {
             const distA = getHaversineDistance(latitude, longitude, a.lat, a.lng);
             const distB = getHaversineDistance(latitude, longitude, b.lat, b.lng);
             return distA - distB;
          })[0];
          
          if (closestArea) {
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
        
        // Dispatch custom location and OSM locations to UI state so they can be selected if desired
        dispatch(addLiveAreas([myLocationArea, ...liveAreas]));
      })
      .catch(async (err) => {
        console.log("Auto-mount geolocator skipped or unauthorized:", err);
        // Fallback coordinates (Yaba central) so the app remains lively if they don't have location
        const fallbackCoords: [number, number] = [6.5095, 3.3711];
        if (!userLocation) {
          dispatch(setUserLocation(fallbackCoords));
        }
        
        // Fetch live actual nearby areas/streets from OpenStreetMap for the fallback location
        const liveAreas = await fetchLiveNearbyAreasFromOSM(fallbackCoords[0], fallbackCoords[1]);
        if (liveAreas.length > 0) {
          dispatch(addLiveAreas(liveAreas));
        }
      });

  }, [areas.length, dispatch, userLocation]);
}
