"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedAreaId, setUserLocation } from "@/store/slices/appSlice";
import { addLiveAreas, saveCustomAreaThunk } from "@/store/slices/dataSlice";
import { getPreciseLocation, reverseGeocodeCoordinates, fetchLiveNearbyAreasFromOSM, getHaversineDistance } from "@/lib/geolocation";
import { getDeviceId } from "@/lib/device";

export function useAutoLocation() {
  const dispatch = useAppDispatch();
  const areas = useAppSelector((state) => state.data.areas);
  const userLocation = useAppSelector((state) => state.app.userLocation);
  
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  
  const hasAttemptedRef = useRef(false);

  // Sync selected area to localStorage so it persists across refreshes
  const isInitialLoadRef = useRef(true);
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    if (selectedAreaId && areas.length > 0) {
      const activeArea = areas.find((a) => a.id === selectedAreaId);
      if (activeArea) {
        localStorage.setItem("lightpulse_saved_area_id", activeArea.id);
        localStorage.setItem("lightpulse_saved_area_lat", activeArea.lat.toString());
        localStorage.setItem("lightpulse_saved_area_lng", activeArea.lng.toString());
      }
    }
  }, [selectedAreaId, areas]);

  useEffect(() => {
    if (typeof window === "undefined" || hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    
    const savedAreaId = localStorage.getItem("lightpulse_saved_area_id");
    const savedAreaLat = localStorage.getItem("lightpulse_saved_area_lat");
    const savedAreaLng = localStorage.getItem("lightpulse_saved_area_lng");
    
    if (savedAreaId && savedAreaLat && savedAreaLng) {
      dispatch(setSelectedAreaId(savedAreaId));
    }

    if (!navigator.geolocation || userLocation) return;
    
    hasAttemptedRef.current = true;
    
    getPreciseLocation({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 120000,
      fallbackToLowAccuracy: true
    })
      .then(async ([latitude, longitude]) => {
        const coords: [number, number] = [latitude, longitude];

        dispatch(setUserLocation(coords));

        let lgaName = "Your Exact Location";
        try {
          lgaName = await reverseGeocodeCoordinates(latitude, longitude);
        } catch (e) {
          console.warn("Reverse geocode failed", e);
        }

        const liveAreas = await fetchLiveNearbyAreasFromOSM(latitude, longitude);

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
        
        dispatch(addLiveAreas([myLocationArea, ...liveAreas]));
        
        if (savedAreaId && savedAreaLat && savedAreaLng) {
          const dist = getHaversineDistance(latitude, longitude, parseFloat(savedAreaLat), parseFloat(savedAreaLng));
          if (dist > 4) {
            console.log("User moved significantly. Auto-switching to new closest area.");
            const closest = [...liveAreas].sort((a, b) => getHaversineDistance(latitude, longitude, a.lat, a.lng) - getHaversineDistance(latitude, longitude, b.lat, b.lng))[0];
            if (closest) {
              dispatch(setSelectedAreaId(closest.id));
            }
          }
        } else {
          const closest = [...liveAreas].sort((a, b) => getHaversineDistance(latitude, longitude, a.lat, a.lng) - getHaversineDistance(latitude, longitude, b.lat, b.lng))[0];
          if (closest) {
            dispatch(setSelectedAreaId(closest.id));
          }
        }
      })
      .catch(async (err) => {
        console.log("Auto-mount geolocator skipped or unauthorized:", err);
        const fallbackCoords: [number, number] = [6.5095, 3.3711];
        if (!userLocation) {
          dispatch(setUserLocation(fallbackCoords));
        }
        
        const liveAreas = await fetchLiveNearbyAreasFromOSM(fallbackCoords[0], fallbackCoords[1]);
        if (liveAreas.length > 0) {
          dispatch(addLiveAreas(liveAreas));
        }
      });

  }, [areas.length, dispatch, userLocation]);
}
