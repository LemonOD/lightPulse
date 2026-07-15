"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedAreaId, setUserLocation, triggerPwaPrompt } from "@/store/slices/appSlice";
import { submitReport, addLiveAreas, saveCustomAreaThunk } from "@/store/slices/dataSlice";
import { GeocodedPlace } from "@/components/shared/address-autocomplete";
import { getAreaStatusFromReports } from "@/lib/db";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getPreciseLocation, getHaversineDistance, fetchLiveNearbyAreasFromOSM, reverseGeocodeCoordinates, formatDistance } from "@/lib/geolocation";
import { getDeviceId } from "@/lib/device";
import { useAutoLocation } from "@/hooks/use-auto-location";
import { saveHomeArea } from "@/lib/location-memory";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";

// Helper utility (already defined in @/lib/geolocation but imported/bound here)

// Custom Subcomponents
import MapSidebar from "@/components/map/map-sidebar";
import MobileSearchBar from "@/components/map/mobile-search-bar";
import SearchResultsList from "@/components/map/search-results-list";
import MapDetailsCard from "@/components/map/map-details-card";
import MapActionButtons from "@/components/map/map-action-buttons";
import ReportStatusModal from "@/components/map/report-status-modal";

// Dynamically import LeafletMap client-side only (SSR Disabled)
const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full rounded-3xl bg-slate-100 animate-pulse flex flex-col items-center justify-center font-bold text-xs text-slate-400 gap-3 border border-slate-200/50">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin" />
        <span>LOADING NEIGHBORHOOD MAPS...</span>
      </div>
    )
  }
);

export default function MapPage() {
  const dispatch = useAppDispatch();
  const areas = useAppSelector((state) => state.data.areas);
  const reports = useAppSelector((state) => state.data.reports);
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const userLocation = useAppSelector((state) => state.app.userLocation);

  const [mapSearch, setMapSearch] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStatus, setReportStatus] = useState<"LIGHT_AVAILABLE" | "LIGHT_OUT" | "LOW_VOLTAGE" | "UNKNOWN" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLegendMobile, setShowLegendMobile] = useState(false);
  const [centerOnUser, setCenterOnUser] = useState(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  // Global auto-location: registers GPS position & "My Current Location" from any page
  useAutoLocation();

  useEffect(() => {
    if (!selectedAreaId && areas.length > 0 && !isLocating) {
      if (userLocation) {
        let nearest = areas[0];
        let minDist = Infinity;
        areas.forEach(a => {
          if (a.lat && a.lng) {
            const d = getHaversineDistance(userLocation[0], userLocation[1], a.lat, a.lng);
            if (d < minDist) {
              minDist = d;
              nearest = a;
            }
          }
        });
        dispatch(setSelectedAreaId(nearest.id));
        setCenterOnUser(true);
      } else {
        // Fallback to home area if no GPS
        if (homeAreaId && areas.some(a => a.id === homeAreaId)) {
          dispatch(setSelectedAreaId(homeAreaId));
        } else {
          // Fallback to a major hub instead of the first alphabetical (e.g., Ajebo)
          const fallback = areas.find(a => a.name.toLowerCase().includes("yaba")) ||
                           areas.find(a => a.name.toLowerCase().includes("lagos")) ||
                           areas[0];
          dispatch(setSelectedAreaId(fallback.id));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAreaId, areas, userLocation, isLocating, dispatch, homeAreaId]);

  const areasWithStatus = useMemo(() => {
    const uniqueAreasMap = new Map<string, typeof areas[0]>();
    areas.forEach(a => {
      const normalizedName = a.name.toLowerCase().trim();
      if (!uniqueAreasMap.has(normalizedName)) {
        uniqueAreasMap.set(normalizedName, a);
      }
    });
    const uniqueAreas = Array.from(uniqueAreasMap.values());

    return uniqueAreas.map(area => {
      let status = getAreaStatusFromReports(area.id, reports);
      if (status === "UNKNOWN" && (area as any).current_status && (area as any).current_status !== "UNKNOWN") {
        status = (area as any).current_status;
      }
      
      const areaReports = reports.filter(r => r.area_id === area.id);

      let timeAgo = "No recent data";
      let detailLabel = "";
      let isStale = false;
      let confirmsCount = areaReports.reduce((sum, r) => sum + r.confidence_score, 0);

      const latestReport = [...areaReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (latestReport) {
        const diffMins = differenceInMinutes(new Date(), new Date(latestReport.created_at));
        if (diffMins < 1) {
          timeAgo = "Reported just now";
        } else {
          timeAgo = `Reported ${formatDistanceToNow(new Date(latestReport.created_at))} ago`;
        }
        
        if (diffMins > 120) {
           timeAgo += " (Stale)";
           isStale = true;
        }
      }

      detailLabel = confirmsCount > 0 ? `${confirmsCount} community verifications` : "Pending status validation";

      // Add distance calculation if userLocation is available!
      let distanceValue = Infinity;
      let distanceText = "";
      if (userLocation) {
        distanceValue = getHaversineDistance(userLocation[0], userLocation[1], area.lat, area.lng);
        distanceText = formatDistance(distanceValue);
        detailLabel = `${distanceText} • ${detailLabel}`;
      }

      return {
        ...area,
        status,
        timeAgo,
        isStale,
        detailLabel,
        confirmsCount,
        distanceValue
      };
    });
  }, [areas, reports, userLocation]);

  // Handle sidebar local search filtering and proximity sorting
  const filteredMapAreas = useMemo(() => {
    let list = [...areasWithStatus];

    // Proximity sort and filter if user GPS is loaded
    if (userLocation) {
      list = list.filter(a => (a.distanceValue !== undefined && a.distanceValue <= 10));
      list.sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
    }

    if (!mapSearch.trim()) return list;
    const query = mapSearch.toLowerCase().trim();
    return list.filter(a => a.name.toLowerCase().includes(query));
  }, [areasWithStatus, mapSearch, userLocation]);

  const activeArea = useMemo(() => {
    let targetId = selectedAreaId;
    if (!targetId && homeAreaId) targetId = homeAreaId;

    if (targetId) {
      const found = areasWithStatus.find(a => a.id === targetId);
      if (found) return found;
    }
    
    // Fallback to a major hub instead of the first alphabetical (e.g., Ajebo)
    return areasWithStatus.find(a => a.name.toLowerCase().includes("yaba")) ||
           areasWithStatus.find(a => a.name.toLowerCase().includes("lagos")) ||
           areasWithStatus[0] || null;
  }, [areasWithStatus, selectedAreaId, homeAreaId]);

  const handleSelectArea = (areaId: string) => {
    setCenterOnUser(false); // Stop locking camera to user coordinate
    dispatch(setSelectedAreaId(areaId));
  };

  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    const toastId = toast.loading("Pinging GPS satellites...");

    getPreciseLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      fallbackToLowAccuracy: true
    })
      .then(async ([latitude, longitude]) => {
        const coords: [number, number] = [latitude, longitude];

        // Smart hybrid reverse geocoding
        let lgaName = "My Current Location";
        try {
          lgaName = await reverseGeocodeCoordinates(latitude, longitude);
        } catch (geocodeErr) {
          console.warn("Reverse geocode failed:", geocodeErr);
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

        // Store globally in Redux
        dispatch(setUserLocation(coords));
        setCenterOnUser(true);

        // Fetch live actual nearby areas/streets from OpenStreetMap to place them on the map
        const liveAreas = await fetchLiveNearbyAreasFromOSM(latitude, longitude);
        
        dispatch(addLiveAreas([myLocationArea, ...liveAreas]));

        // Check if there's a registered area within 1km
        const registeredAreas = areas.filter(a => !a.id.startsWith("custom-loc") && !a.id.startsWith("live-geom"));
        const closestRegistered = [...registeredAreas].sort((a, b) => getHaversineDistance(latitude, longitude, a.lat, a.lng) - getHaversineDistance(latitude, longitude, b.lat, b.lng))[0];
        
        let targetArea = liveAreas.length > 0 ? liveAreas[0] : myLocationArea;
        if (closestRegistered && getHaversineDistance(latitude, longitude, closestRegistered.lat, closestRegistered.lng) <= 1) {
          targetArea = closestRegistered;
        }

        // Trigger dynamic selection
        dispatch(setSelectedAreaId(targetArea.id));

        // Dismiss loading toast
        toast.dismiss(toastId);

        toast.success(`GPS Calibrated! Located near ${lgaName}. Centered on closest area: ${targetArea.name}.`, {
          icon: "📍",
          duration: 4000
        });
      })
      .catch((error) => {
        toast.dismiss(toastId);
        console.error("Geolocation error:", error);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable location services.", {
            icon: "🔒",
          });
        } else {
          toast.error("GPS connection timed out. Please try again.", {
            icon: "📡",
          });
        }
      });
  };

  const handleOpenReportModal = () => {
    if (activeArea) {
      setReportStatus(activeArea.status);
      setShowReportModal(true);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent, customName?: string) => {
    e.preventDefault();
    if (!reportStatus || !activeArea) return;

    setIsSubmitting(true);
    try {
      const finalAreaName = customName ? customName.trim() || activeArea.name : activeArea.name;

      if (activeArea.id.startsWith("custom-loc-gps") && finalAreaName !== activeArea.name) {
        await dispatch(saveCustomAreaThunk({
          ...activeArea,
          name: finalAreaName,
          slug: finalAreaName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        }));
      }

      const report = await dispatch(
        submitReport({
          area_id: activeArea.id,
          area_name: finalAreaName,
          status: reportStatus,
          comment: comment.trim() || `Status updated to ${reportStatus === "LIGHT_AVAILABLE" ? "Light Restored" : reportStatus === "LIGHT_OUT" ? "Light Out" : "Low Voltage"}`,
          ...(userLocation ? { latitude: userLocation[0], longitude: userLocation[1] } : {}),
        })
      ).unwrap();

      if (report.area_id !== activeArea.id) {
        dispatch(setSelectedAreaId(report.area_id));
        toast.success(`Report merged with a nearby community!`, {
          icon: "🔗",
        });
        // Anchor merged area as home
        saveHomeArea(report.area_id, userLocation?.[0] ?? activeArea.lat, userLocation?.[1] ?? activeArea.lng);
      } else {
        toast.success(`Power status registered! Thank you for updating ${activeArea.name}.`, {
          icon: "⚡",
        });
        // Anchor this area as home
        saveHomeArea(activeArea.id, activeArea.lat, activeArea.lng);
      }

      setShowReportModal(false);
      setComment("");
      dispatch(triggerPwaPrompt());
    } catch (err) {
      console.error(err);
      toast.error("Failed to register power status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlace = (place: GeocodedPlace) => {
    const selectedArea = {
      id: place.id,
      name: place.name,
      slug: place.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      lat: place.lat,
      lng: place.lng,
      description: place.description || "Lagos, Nigeria",
      region: "Searched Address"
    };

    // Dispatch geocoded location to Redux state
    dispatch(addLiveAreas([selectedArea]));
    // Center Leaflet map and focus it
    handleSelectArea(selectedArea.id);
  };

  const getBadgeColor = (status: string) => {
    if (status === "LIGHT_AVAILABLE") return "text-emerald-500 bg-emerald-50 border-emerald-100/50";
    if (status === "LIGHT_OUT") return "text-red-500 bg-red-50 border-red-100/50";
    if (status === "LOW_VOLTAGE") return "text-amber-500 bg-amber-50 border-amber-100/50";
    return "text-slate-500 bg-slate-50 border-slate-100/50";
  };

  return (
    <main className="w-full relative flex flex-col select-none md:mx-auto md:w-full md:px-8 md:py-6 md:pb-24 md:flex-row md:gap-6 h-[calc(100vh-4rem)] md:overflow-hidden md:select-none">

      {/* LEFT SIDEBAR: Search & Neighborhood List (1/3 Width on Desktop, Hidden on Mobile) */}
      <MapSidebar
        mapSearch={mapSearch}
        setMapSearch={setMapSearch}
        filteredMapAreas={filteredMapAreas}
        selectedAreaId={selectedAreaId}
        handleSelectArea={handleSelectArea}
        handleOpenReportModal={handleOpenReportModal}
        activeArea={activeArea}
        getBadgeColor={getBadgeColor}
      />

      {/* RIGHT CONTAINER: Interactive Map View (2/3 Width on Desktop, Full Bleed on Mobile) */}
      <div className="w-full h-full relative z-0 md:flex-1 md:relative md:rounded-3xl md:overflow-hidden md:h-[calc(100vh-5rem)] md:border md:border-slate-100 md:shadow-md">

        {/* Dynamic Client-Side Leaflet Map rendering wrapped in a z-0 container to send map to back */}
        <div className="absolute inset-0 z-0">
          <LeafletMap
            areas={areasWithStatus}
            selectedAreaId={selectedAreaId}
            userLocation={userLocation}
            centerOnUser={centerOnUser}
            onSelectArea={handleSelectArea}
          />
        </div>

        {/* Floating Mobile Search Bar Overlay (Only visible on mobile) */}
        <MobileSearchBar
          mapSearch={mapSearch}
          setMapSearch={setMapSearch}
          showLegendMobile={showLegendMobile}
          setShowLegendMobile={setShowLegendMobile}
          handleSelectPlace={handleSelectPlace}
          onAutocompleteOpenChange={setIsAutocompleteOpen}
        />

        {/* Floating Search Results Dropdown List on Mobile */}
        {!isAutocompleteOpen && (
          <SearchResultsList
            mapSearch={mapSearch}
            setMapSearch={setMapSearch}
            filteredMapAreas={filteredMapAreas}
            handleSelectArea={handleSelectArea}
            getBadgeColor={getBadgeColor}
          />
        )}

        {/* Floating Mobile Bottom Details Card (Only visible on mobile) */}
        <MapDetailsCard
          activeArea={activeArea}
          handleOpenReportModal={handleOpenReportModal}
        />

        {/* Floating Round Buttons at Bottom Right */}
        <MapActionButtons
          handleDetectLocation={handleDetectLocation}
          handleOpenReportModal={handleOpenReportModal}
        />

        {/* MAP LEGEND OVERLAY (Glassmorphic floating container, always visible on desktop, toggleable on mobile) */}
        <div className={`absolute bottom-5 left-5 z-10 bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-2xl glass-shadow flex-col gap-2.5 max-w-[160px] pointer-events-auto ${
          showLegendMobile ? "flex" : "hidden md:flex"
        }`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-0.5">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
              Map Legend
            </span>
            <button
              onClick={() => setShowLegendMobile(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white shadow-sm" />
              <span>Power On</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 border border-white shadow-sm" />
              <span>Power Out</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 border border-white shadow-sm" />
              <span>Unstable</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 border border-white shadow-sm" />
              <span>No Data</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL POPUP FOR REPORT STATUS */}
      <ReportStatusModal
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        activeArea={activeArea}
        reportStatus={reportStatus}
        setReportStatus={(status) => setReportStatus(status)}
        comment={comment}
        setComment={setComment}
        isSubmitting={isSubmitting}
        handleReportSubmit={handleReportSubmit}
        userLocation={userLocation}
      />

    </main>
  );
}
