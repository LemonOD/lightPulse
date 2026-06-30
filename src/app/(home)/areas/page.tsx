"use client";

import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedAreaId, setDetectedAreaId, setIsLocating, setSearchQuery, setUserLocation } from "@/store/slices/appSlice";
import { addLiveAreas } from "@/store/slices/dataSlice";
import { useRouter } from "next/navigation";
import { Map as MapIcon } from "lucide-react";
import { getAreaStatusFromReports } from "@/lib/db";
import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getPreciseLocation, getHaversineDistance, fetchLiveNearbyAreasFromOSM, reverseGeocodeCoordinates } from "@/lib/geolocation";
import { useAutoLocation } from "@/hooks/use-auto-location";

import AreasHeader from "@/components/areas/areas-header";
import NearYouGrid from "@/components/areas/near-you-grid";
import AllAreasDirectory from "@/components/areas/all-areas-directory";
import MobileLocationButton from "@/components/areas/mobile-location-button";

export default function AreasPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const areas = useAppSelector((state) => state.data.areas);
  const reports = useAppSelector((state) => state.data.reports);

  const searchQuery = useAppSelector((state) => state.app.searchQuery);
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const isLocating = useAppSelector((state) => state.app.isLocating);
  const userLocation = useAppSelector((state) => state.app.userLocation);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchLiveNearbyAreas = useCallback(async (lat: number, lon: number, currentAreas: typeof areas) => {
    const liveAreas = await fetchLiveNearbyAreasFromOSM(lat, lon);
    
    if (liveAreas.length > 0) {
      dispatch(addLiveAreas(liveAreas));
    }

    const combined = [...currentAreas, ...liveAreas];
    let closestArea = combined[0];
    let minDistance = Infinity;

    combined.forEach((area) => {
      const dist = getHaversineDistance(lat, lon, area.lat, area.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestArea = area;
      }
    });

    dispatch(setDetectedAreaId(closestArea.id));
  }, [dispatch]);


  useAutoLocation();

  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    dispatch(setIsLocating(true));
    const toastId = toast.loading("Locating GPS satellites...");

    getPreciseLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      fallbackToLowAccuracy: true
    })
      .then(async ([latitude, longitude]) => {
        dispatch(setIsLocating(false));
        const coords: [number, number] = [latitude, longitude];

        dispatch(setUserLocation(coords));

        await fetchLiveNearbyAreas(latitude, longitude, areas);

        toast.dismiss(toastId);

        try {
          const lgaName = await reverseGeocodeCoordinates(latitude, longitude);
          toast.success(`GPS Located near ${lgaName}!`, {
            icon: "📍",
            duration: 4000
          });
        } catch (geocodeErr) {
          console.warn("Reverse geocode failed:", geocodeErr);
          toast.success("GPS Located!", {
            icon: "📍",
            duration: 4000
          });
        }
      })
      .catch((error) => {
        dispatch(setIsLocating(false));
        toast.dismiss(toastId);
        console.error("Geolocation error:", error);

        const fallbackCoords: [number, number] = [6.5095, 3.3711];
        dispatch(setUserLocation(fallbackCoords));
        dispatch(setDetectedAreaId("area-1")); // Yaba

        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Defaulting closest area to Yaba.", {
            icon: "🔒",
          });
        } else {
          toast.error("GPS connection timed out. Defaulting closest area to Yaba.", {
            icon: "📡",
          });
        }
      });
  };

  const handleSelectArea = (areaId: string) => {
    dispatch(setSelectedAreaId(areaId));
    router.push("/");
  };

  const areasWithStatus = useMemo(() => {
    const uniqueAreasMap = new Map<string, typeof areas[0]>();
    areas.forEach(a => {
      if (!uniqueAreasMap.has(a.name)) {
        uniqueAreasMap.set(a.name, a);
      }
    });
    const uniqueAreas = Array.from(uniqueAreasMap.values());

    return uniqueAreas.map(area => {
      const status = getAreaStatusFromReports(area.id, reports);
      const areaReports = reports.filter(r => r.area_id === area.id);

      const latestReport = [...areaReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      const timeAgo = latestReport
        ? getRelativeMinutes(latestReport.created_at)
        : null;

      const totalConfirms = areaReports.reduce((sum, r) => sum + r.confidence_score, 0);

      return {
        ...area,
        status,
        timeAgo: timeAgo ? `Updated ${timeAgo}m ago` : "No recent reports",
        confirmations: totalConfirms,
        reportsCount: areaReports.length
      };
    });
  }, [areas, reports]);

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areasWithStatus;
    const query = searchQuery.toLowerCase().trim();
    return areasWithStatus.filter(
      a => a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query)
    );
  }, [areasWithStatus, searchQuery]);

  const nearYouAreas = useMemo(() => {
    if (userLocation) {
      const areasWithDist = areasWithStatus.map(a => {
        const distance = getHaversineDistance(userLocation[0], userLocation[1], a.lat, a.lng);
        return {
          ...a,
          distance,
          timeAgo: a.timeAgo || "Updated just now",
          customInfo: `${distance.toFixed(1)} km away`,
          avatars: a.name === "Yaba Tech" ? [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=50&h=50&fit=crop"
          ] : [],
          avatarExtra: a.name === "Yaba Tech" ? "+12" : ""
        };
      });

      return areasWithDist.sort((a, b) => a.distance - b.distance).slice(0, 3);
    }

    const targets = ["Yaba Tech", "Adeniran Ogunsanya", "Akoka Finbarrs"];
    const baseList = areasWithStatus.filter(a => targets.includes(a.name));

    return baseList.map(a => {
      if (a.name === "Yaba Tech") {
        return {
          ...a,
          timeAgo: "Updated 2m ago",
          status: "LIGHT_AVAILABLE" as const,
          customInfo: "",
          avatars: [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=50&h=50&fit=crop"
          ],
          avatarExtra: "+12",
          distance: 0.5
        };
      }
      if (a.name === "Adeniran Ogunsanya") {
        return {
          ...a,
          timeAgo: "Updated 8m ago",
          status: "LIGHT_OUT" as const,
          customInfo: "Reports spiking",
          confirmations: 42,
          avatars: [],
          avatarExtra: "",
          distance: 2.1
        };
      }
      return {
        ...a,
        timeAgo: "Updated 15m ago",
        status: "LOW_VOLTAGE" as const,
        customInfo: "Voltage unstable",
        avatars: [],
        avatarExtra: "",
        distance: 1.4
      };
    });
  }, [areasWithStatus, userLocation]);

  const alphabetizedGroups = useMemo(() => {
    const groups: Record<string, typeof filteredAreas> = {};

    filteredAreas.forEach(area => {
      const firstLetter = area.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(area);
    });

    return Object.keys(groups)
      .sort()
      .reduce((acc, letter) => {
        acc[letter] = groups[letter].sort((a, b) => a.name.localeCompare(b.name));
        return acc;
      }, {} as Record<string, typeof filteredAreas>);
  }, [filteredAreas]);

  function getRelativeMinutes(isoString: string): number {
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.max(1, Math.round(diffMs / (1000 * 60)));
  }

  return (
    <main className="flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
      
      <AreasHeader
        searchQuery={searchQuery}
        onSearchChange={(val) => dispatch(setSearchQuery(val))}
        handleDetectLocation={handleDetectLocation}
        isLocating={isLocating}
      />

      {!searchQuery && (
        <NearYouGrid
          nearYouAreas={nearYouAreas}
          selectedAreaId={selectedAreaId}
          userLocation={userLocation}
          handleSelectArea={handleSelectArea}
        />
      )}

      <AllAreasDirectory
        alphabetizedGroups={alphabetizedGroups}
        selectedAreaId={selectedAreaId}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleSelectArea={handleSelectArea}
        searchQuery={searchQuery}
      />

      <MobileLocationButton
        handleDetectLocation={handleDetectLocation}
        isLocating={isLocating}
      />

      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 hidden md:block">
        <Link
          href="/map"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs tracking-widest transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <MapIcon className="h-4 w-4 text-emerald-400" />
          <span>View Integrated Live Map</span>
        </Link>
      </div>

    </main>
  );
}
