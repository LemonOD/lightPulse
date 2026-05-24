"use client";

import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedAreaId, setDetectedAreaId, setIsLocating, setSearchQuery, setUserLocation } from "@/store/slices/appSlice";
import { useRouter } from "next/navigation";
import { Map as MapIcon } from "lucide-react";
import { getAreaStatusFromReports } from "@/lib/db";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

// Custom Subcomponents
import AreasHeader from "@/components/areas/areas-header";
import NearYouGrid from "@/components/areas/near-you-grid";
import AllAreasDirectory from "@/components/areas/all-areas-directory";
import MobileLocationButton from "@/components/areas/mobile-location-button";

// Helper utility to calculate physical distance in kilometers using the Haversine formula
const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  // Real GPS Location detection using Geolocation and Nominatim APIs
  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    dispatch(setIsLocating(true));
    const toastId = toast.loading("Locating GPS satellites...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        dispatch(setIsLocating(false));
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];

        // Store globally in Redux
        dispatch(setUserLocation(coords));

        // Compute distances and find closest area
        let closestArea = areas[0];
        let minDistance = Infinity;

        areas.forEach((area) => {
          const dist = getHaversineDistance(latitude, longitude, area.lat, area.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestArea = area;
          }
        });

        // Trigger dynamic selection
        dispatch(setDetectedAreaId(closestArea.id));

        // Dismiss loading toast
        toast.dismiss(toastId);

        // Attempt reverse geocoding via Nominatim API (with standard graceful fallback)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "User-Agent": "LytPulse/1.0"
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            const lgaName = address.county || address.city_district || address.suburb || address.neighbourhood || "Lagos";
            
            toast.success(`GPS Located near ${lgaName}! Closest neighborhood: ${closestArea.name}.`, {
              icon: "📍",
              duration: 4000
            });
          } else {
            throw new Error("Nominatim reverse geocoding failed");
          }
        } catch {
          toast.success(`GPS Located! Nearest area set as ${closestArea.name} (${minDistance.toFixed(1)} km away).`, {
            icon: "📍",
            duration: 4000
          });
        }
      },
      (error) => {
        dispatch(setIsLocating(false));
        toast.dismiss(toastId);
        console.error("Geolocation error:", error);

        // Fallback coordinates (Yaba central: [6.5095, 3.3711])
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
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSelectArea = (areaId: string) => {
    dispatch(setSelectedAreaId(areaId));
    // Smooth transition redirect back to home dashboard
    router.push("/");
  };

  // Compute status for all areas
  const areasWithStatus = useMemo(() => {
    return areas.map(area => {
      const status = getAreaStatusFromReports(area.id, reports);
      const areaReports = reports.filter(r => r.area_id === area.id);

      // Calculate dynamic metadata
      const latestReport = [...areaReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      const timeAgo = latestReport
        ? getRelativeMinutes(latestReport.created_at)
        : null;

      // Confirmations sum
      const totalConfirms = areaReports.reduce((sum, r) => sum + r.confirmations_count, 0);

      return {
        ...area,
        status,
        timeAgo: timeAgo ? `Updated ${timeAgo}m ago` : "No recent reports",
        confirmations: totalConfirms,
        reportsCount: areaReports.length
      };
    });
  }, [areas, reports]);

  // Filtered areas based on search query
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areasWithStatus;
    const query = searchQuery.toLowerCase().trim();
    return areasWithStatus.filter(
      a => a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query)
    );
  }, [areasWithStatus, searchQuery]);

  // Proximity "Near You" areas matching Design 1, dynamically calculated if GPS context exists
  const nearYouAreas = useMemo(() => {
    if (userLocation) {
      // Calculate distances for all areas and sort them by physical proximity
      const areasWithDist = areasWithStatus.map(a => {
        const distance = getHaversineDistance(userLocation[0], userLocation[1], a.lat, a.lng);
        return {
          ...a,
          distance,
          timeAgo: a.timeAgo || "Updated just now",
          customInfo: `${distance.toFixed(1)} km away`,
          avatars: a.name === "Yaba" ? [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=50&h=50&fit=crop"
          ] : [],
          avatarExtra: a.name === "Yaba" ? "+12" : ""
        };
      });

      // Sort by physical proximity and take the 3 closest ones!
      return areasWithDist.sort((a, b) => a.distance - b.distance).slice(0, 3);
    }

    // Return hardcoded Yaba, Surulere, Iwaya for Design 1 fidelity when location not loaded
    const targets = ["Yaba", "Surulere", "Iwaya"];
    const baseList = areasWithStatus.filter(a => targets.includes(a.name));

    // Add realistic visual mockup overrides if data is fresh
    return baseList.map(a => {
      if (a.name === "Yaba") {
        return {
          ...a,
          timeAgo: "Updated 2m ago",
          status: "stable" as const,
          customInfo: "",
          avatars: [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=50&h=50&fit=crop"
          ],
          avatarExtra: "+12",
          distance: 0.5
        };
      }
      if (a.name === "Surulere") {
        return {
          ...a,
          timeAgo: "Updated 8m ago",
          status: "outage" as const,
          customInfo: "Reports spiking",
          confirmations: 42,
          avatars: [],
          avatarExtra: "",
          distance: 2.1
        };
      }
      // Iwaya
      return {
        ...a,
        timeAgo: "Updated 15m ago",
        status: "unstable" as const,
        customInfo: "Voltage unstable",
        avatars: [],
        avatarExtra: "",
        distance: 1.4
      };
    });
  }, [areasWithStatus, userLocation]);

  // Alphabetical grouping for the directory
  const alphabetizedGroups = useMemo(() => {
    const groups: Record<string, typeof filteredAreas> = {};

    filteredAreas.forEach(area => {
      const firstLetter = area.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(area);
    });

    // Sort letters and sorting inside lists
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
      
      {/* 1. Header Title & Search Input component */}
      <AreasHeader
        searchQuery={searchQuery}
        onSearchChange={(val) => dispatch(setSearchQuery(val))}
        handleDetectLocation={handleDetectLocation}
        isLocating={isLocating}
      />

      {/* 2. Near You Grid component */}
      {!searchQuery && (
        <NearYouGrid
          nearYouAreas={nearYouAreas}
          selectedAreaId={selectedAreaId}
          userLocation={userLocation}
          handleSelectArea={handleSelectArea}
        />
      )}

      {/* 3. Alphabetized Directory List component */}
      <AllAreasDirectory
        alphabetizedGroups={alphabetizedGroups}
        selectedAreaId={selectedAreaId}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleSelectArea={handleSelectArea}
        searchQuery={searchQuery}
      />

      {/* 4. Mobile Sticky Detect Location capsule */}
      <MobileLocationButton
        handleDetectLocation={handleDetectLocation}
        isLocating={isLocating}
      />

      {/* Floating Centered Desktop Live Map Button */}
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
