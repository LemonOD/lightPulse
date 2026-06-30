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
    // Note: We've removed the automatic geolocation ping on mount to respect user privacy.
    // The application will use the selectedAreaId from Redux or user-provided selections.
    // If the database is completely empty and we still want a fallback, we can rely on seed data.
    
    if (typeof window === "undefined" || hasAttemptedRef.current || userLocation) return;
    
    hasAttemptedRef.current = true;
    
    // Fallback coordinates (Yaba central) so the app remains lively if they don't have location
    const fallbackCoords: [number, number] = [6.5095, 3.3711];
    if (!userLocation) {
      dispatch(setUserLocation(fallbackCoords));
    }

  }, [areas.length, dispatch, userLocation]);
}
