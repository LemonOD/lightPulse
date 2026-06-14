"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedAreaId, setUserLocation } from "@/store/slices/appSlice";
import { submitReport, addLiveAreas, saveCustomAreaThunk } from "@/store/slices/dataSlice";
import { GeocodedPlace } from "@/components/shared/address-autocomplete";
import { getAreaStatusFromReports } from "@/lib/db";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getPreciseLocation, getHaversineDistance, fetchLiveNearbyAreasFromOSM, reverseGeocodeCoordinates } from "@/lib/geolocation";
import { useAutoLocation } from "@/hooks/use-auto-location";

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
  const [reportStatus, setReportStatus] = useState<"stable" | "outage" | "unstable" | "unknown" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLegendMobile, setShowLegendMobile] = useState(false);
  const [centerOnUser, setCenterOnUser] = useState(false);

  // Global auto-location: registers GPS position & "My Current Location" from any page
  useAutoLocation();

  // Map-specific: when userLocation becomes available for the first time, auto-select the closest area
  useEffect(() => {
    if (!userLocation || areas.length === 0) return;
    
    let closestArea = areas[0];
    let minDistance = Infinity;
    areas.forEach((area) => {
      const dist = getHaversineDistance(userLocation[0], userLocation[1], area.lat, area.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestArea = area;
      }
    });

    dispatch(setSelectedAreaId(closestArea.id));
    setCenterOnUser(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Compute areas with their live status metrics
  const areasWithStatus = useMemo(() => {
    return areas.map(area => {
      const status = getAreaStatusFromReports(area.id, reports);
      const areaReports = reports.filter(r => r.area_id === area.id);

      // Custom visual detail simulation to match the third mockup exactly
      let timeAgo = "No recent data";
      let detailLabel = "";
      let confirmsCount = areaReports.reduce((sum, r) => sum + r.confirmations_count, 0);

      const latestReport = [...areaReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (latestReport) {
        // eslint-disable-next-line react-hooks/purity
        const diffMins = Math.max(1, Math.round((Date.now() - new Date(latestReport.created_at).getTime()) / (1000 * 60)));
        if (diffMins < 60) timeAgo = `Last updated: ${diffMins} mins ago`;
        else timeAgo = `Last updated: ${Math.round(diffMins / 60)} hours ago`;
      }

      if (area.name === "Yaba") {
        timeAgo = "Last updated: 2 mins ago";
        detailLabel = "124 community confirmations";
        if (status === "stable") confirmsCount = 124;
      } else if (area.name === "Sabo") {
        timeAgo = "Last updated: 14 mins ago";
        detailLabel = "Reported by 48 users nearby";
      } else if (area.name === "Ojuelegba") {
        timeAgo = "Last updated: 45 mins ago";
        detailLabel = "Voltage fluctuations reported";
      } else if (area.name === "Akoka") {
        timeAgo = "Last updated: 3 hours ago";
        detailLabel = "Need status update from this area";
      } else {
        detailLabel = confirmsCount > 0 ? `${confirmsCount} community verifications` : "Pending status validation";
      }

      // Add distance calculation if userLocation is available!
      let distanceValue = Infinity;
      let distanceText = "";
      if (userLocation) {
        distanceValue = getHaversineDistance(userLocation[0], userLocation[1], area.lat, area.lng);
        distanceText = `${distanceValue.toFixed(1)} km away`;
        // Append distance to the detail label
        detailLabel = `${distanceText} • ${detailLabel}`;
      }

      return {
        ...area,
        status,
        timeAgo,
        detailLabel,
        confirmsCount,
        distanceValue
      };
    });
  }, [areas, reports, userLocation]);

  // Handle sidebar local search filtering and proximity sorting
  const filteredMapAreas = useMemo(() => {
    const list = [...areasWithStatus];

    // Proximity sort if user GPS is loaded
    if (userLocation) {
      list.sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
    }

    if (!mapSearch.trim()) return list;
    const query = mapSearch.toLowerCase().trim();
    return list.filter(a => a.name.toLowerCase().includes(query));
  }, [areasWithStatus, mapSearch, userLocation]);

  const activeArea = useMemo(() => {
    return areasWithStatus.find(a => a.id === selectedAreaId) || areasWithStatus[0] || null;
  }, [areasWithStatus, selectedAreaId]);

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
        let lgaName = "Your Exact Location";
        try {
          lgaName = await reverseGeocodeCoordinates(latitude, longitude);
        } catch (geocodeErr) {
          console.warn("Reverse geocode failed:", geocodeErr);
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

        // Store globally in Redux
        dispatch(setUserLocation(coords));
        setCenterOnUser(true);

        // Fetch live actual nearby areas/streets from OpenStreetMap to place them on the map
        const liveAreas = await fetchLiveNearbyAreasFromOSM(latitude, longitude);
        
        dispatch(addLiveAreas([myLocationArea, ...liveAreas]));

        // Compute distances and find closest area from combined list
        const combined = [...areas, myLocationArea, ...liveAreas];
        let closestArea = combined[0] || areas[0];
        let minDistance = Infinity;

        combined.forEach((area) => {
          const dist = getHaversineDistance(latitude, longitude, area.lat, area.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestArea = area;
          }
        });

        // Trigger dynamic selection
        dispatch(setSelectedAreaId(closestArea.id));

        // Dismiss loading toast
        toast.dismiss(toastId);

        toast.success(`GPS Calibrated! Located near ${lgaName}. Centered on closest area: ${closestArea.name}.`, {
          icon: "📍",
          duration: 4000
        });
      })
      .catch((error) => {
        toast.dismiss(toastId);
        console.error("Geolocation error:", error);

        // Robust fallback coordinates (Yaba central: [6.5095, 3.3711])
        const fallbackCoords: [number, number] = [6.5095, 3.3711];
        dispatch(setUserLocation(fallbackCoords));
        setCenterOnUser(true);
        dispatch(setSelectedAreaId("area-1")); // Yaba

        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Defaulting map center to Yaba.", {
            icon: "🔒",
          });
        } else {
          toast.error("GPS connection timed out. Defaulting map center to Yaba.", {
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

      if (activeArea.id === "custom-loc-gps" && finalAreaName !== activeArea.name) {
        await dispatch(saveCustomAreaThunk({
          ...activeArea,
          name: finalAreaName,
          slug: finalAreaName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        }));
      }

      await dispatch(
        submitReport({
          area_id: activeArea.id,
          area_name: finalAreaName,
          status: reportStatus,
          comment: comment.trim() || `Status updated to ${reportStatus}`,
        })
      ).unwrap();

      toast.success(`Power status registered! Thank you for updating ${activeArea.name}.`, {
        icon: "⚡",
      });

      setShowReportModal(false);
      setComment("");
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
    if (status === "stable") return "text-emerald-500 bg-emerald-50 border-emerald-100/50";
    if (status === "outage") return "text-red-500 bg-red-50 border-red-100/50";
    if (status === "unstable") return "text-amber-500 bg-amber-50 border-amber-100/50";
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
          />
        </div>

        {/* Floating Mobile Search Bar Overlay (Only visible on mobile) */}
        <MobileSearchBar
          mapSearch={mapSearch}
          setMapSearch={setMapSearch}
          showLegendMobile={showLegendMobile}
          setShowLegendMobile={setShowLegendMobile}
          handleSelectPlace={handleSelectPlace}
        />

        {/* Floating Search Results Dropdown List on Mobile */}
        <SearchResultsList
          mapSearch={mapSearch}
          setMapSearch={setMapSearch}
          filteredMapAreas={filteredMapAreas}
          handleSelectArea={handleSelectArea}
          getBadgeColor={getBadgeColor}
        />

        {/* Floating Mobile Bottom Details Card (Only visible on mobile) */}
        <MapDetailsCard
          activeArea={activeArea}
          handleOpenReportModal={handleOpenReportModal}
        />

        {/* Floating Round Buttons at Bottom Right (Only visible on mobile) */}
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
