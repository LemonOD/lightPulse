"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setHomeAreaId, setSelectedAreaId, setUserLocation } from "@/store/slices/appSlice";
import { addLiveAreas, saveCustomAreaThunk } from "@/store/slices/dataSlice";
import {
  getPreciseLocation,
  reverseGeocodeCoordinates,
  fetchLiveNearbyAreasFromOSM,
  getHaversineDistance,
} from "@/lib/geolocation";
import { getDeviceId } from "@/lib/device";
import { resolveStartupArea } from "@/lib/location-memory";

export function useAutoLocation() {
  const dispatch = useAppDispatch();
  const areas = useAppSelector((state) => state.data.areas);
  const userLocation = useAppSelector((state) => state.app.userLocation);

  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    async function initLocation() {
      // Step 1: Try to get the current GPS position.
      let gpsCoords: [number, number] | null = null;
      try {
        const [lat, lng] = await getPreciseLocation({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 120000,
          fallbackToLowAccuracy: true,
        });
        gpsCoords = [lat, lng];
        dispatch(setUserLocation(gpsCoords));
      } catch (err) {
        console.log("GPS unavailable on startup:", err);
      }

      // Step 2: Decide which area to show using GPS-anchored sticky logic.
      const { areaId, shouldAutoDetect, gpsCoords: resolvedCoords } =
        await resolveStartupArea(gpsCoords, getHaversineDistance);

      // Case A: User is still near their saved home area → restore it directly.
      if (areaId && !shouldAutoDetect) {
        dispatch(setSelectedAreaId(areaId));
        dispatch(setHomeAreaId(areaId));

        // Still fetch live OSM areas in background for map accuracy, but don't change selection
        if (resolvedCoords) {
          const [lat, lng] = resolvedCoords;
          const liveAreas = await fetchLiveNearbyAreasFromOSM(lat, lng);
          if (liveAreas.length > 0) {
            dispatch(addLiveAreas(liveAreas));
          }
        }
        return;
      }

      // Case B: User has moved or is new → full GPS-based auto-detection.
      if (shouldAutoDetect && resolvedCoords) {
        const [latitude, longitude] = resolvedCoords;

        let lgaName = "My Current Location";
        try {
          lgaName = await reverseGeocodeCoordinates(latitude, longitude);
        } catch (e) {
          console.warn("Reverse geocode failed", e);
        }

        const liveAreas = await fetchLiveNearbyAreasFromOSM(latitude, longitude);

        if (areas.length === 0 && liveAreas.length > 0) {
          const closestLive = [...liveAreas].sort(
            (a, b) =>
              getHaversineDistance(latitude, longitude, a.lat, a.lng) -
              getHaversineDistance(latitude, longitude, b.lat, b.lng)
          )[0];
          if (closestLive) dispatch(saveCustomAreaThunk(closestLive));
        }

        const myLocationArea = {
          id: `custom-loc-gps-${getDeviceId()}`,
          name: lgaName,
          slug: "my-current-location",
          lat: latitude,
          lng: longitude,
          description: "Device Location",
          region: "Custom Location",
        };

        dispatch(addLiveAreas([myLocationArea, ...liveAreas]));

        // Pick the closest registered area within 1km, otherwise fall back to live OSM area
        const registeredAreas = areas.filter(
          (a) => !a.id.startsWith("custom-loc") && !a.id.startsWith("live-geom")
        );
        const closestRegistered = [...registeredAreas].sort(
          (a, b) =>
            getHaversineDistance(latitude, longitude, a.lat, a.lng) -
            getHaversineDistance(latitude, longitude, b.lat, b.lng)
        )[0];

        if (
          closestRegistered &&
          getHaversineDistance(latitude, longitude, closestRegistered.lat, closestRegistered.lng) <= 1
        ) {
          dispatch(setSelectedAreaId(closestRegistered.id));
          dispatch(setHomeAreaId(closestRegistered.id));
        } else {
          const preciseLiveArea = liveAreas.length > 0 ? liveAreas[0] : myLocationArea;
          dispatch(setSelectedAreaId(preciseLiveArea.id));
          dispatch(setHomeAreaId(preciseLiveArea.id));
        }
        return;
      }

      // Case C: GPS denied and no saved area → use Lagos network fallback
      if (!gpsCoords && !areaId) {
        console.log("No GPS and no saved area — using network fallback.");
        const fallbackCoords: [number, number] = [6.5095, 3.3711];
        dispatch(setUserLocation(fallbackCoords));
        const liveAreas = await fetchLiveNearbyAreasFromOSM(fallbackCoords[0], fallbackCoords[1]);
        if (liveAreas.length > 0) {
          dispatch(addLiveAreas(liveAreas));
        }
      }
    }

    initLocation();
  // Run only once on mount — areas.length changes as DB data loads,
  // but we intentionally don't re-run location logic on those changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);
}
