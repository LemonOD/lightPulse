"use client";

import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedAreaId, setDetectedAreaId, setIsLocating, setSearchQuery } from "@/store/slices/appSlice";
import { useRouter } from "next/navigation";
import { Search, Compass, Grid, List, Map as MapIcon } from "lucide-react";
import { getAreaStatusFromReports } from "@/lib/db";
import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function AreasPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const areas = useAppSelector((state) => state.data.areas);
  const reports = useAppSelector((state) => state.data.reports);

  const searchQuery = useAppSelector((state) => state.app.searchQuery);
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const isLocating = useAppSelector((state) => state.app.isLocating);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Simulated GPS Location detection
  const handleDetectLocation = () => {
    dispatch(setIsLocating(true));

    setTimeout(() => {
      dispatch(setIsLocating(false));
      dispatch(setDetectedAreaId("area-1")); // Force Yaba
      toast.success("GPS Located! Setting nearest area as Yaba.", {
        icon: "📍",
      });
    }, 1200);
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

  // Proximity "Near You" areas matching Design 1
  const nearYouAreas = useMemo(() => {
    // Return hardcoded Yaba, Surulere, Iwaya for Design 1 fidelity
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
          avatarExtra: "+12"
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
          avatarExtra: ""
        };
      }
      // Iwaya
      return {
        ...a,
        timeAgo: "Updated 15m ago",
        status: "unstable" as const,
        customInfo: "Voltage unstable",
        avatars: [],
        avatarExtra: ""
      };
    });
  }, [areasWithStatus]);

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

  const getBadgeColor = (status: string) => {
    if (status === "stable") return "text-emerald-500 bg-emerald-50 border-emerald-100/50";
    if (status === "outage") return "text-red-500 bg-red-50 border-red-100/50";
    if (status === "unstable") return "text-amber-500 bg-amber-50 border-amber-100/50";
    return "text-slate-500 bg-slate-50 border-slate-100/50";
  };

  const getDotColor = (status: string) => {
    if (status === "stable") return "bg-emerald-500";
    if (status === "outage") return "bg-red-500";
    if (status === "unstable") return "bg-amber-500";
    return "bg-slate-300";
  };

  return (
    <main className="flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">

      {/* Title Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
            Neighborhood Directory
          </h1>
          <p className="text-sm font-medium text-slate-500 leading-relaxed mt-2 max-w-xl">
            Browse the real-time power status of all residential and commercial districts across Lagos.
          </p>
        </div>

        {/* Detect Location Button */}
        <button
          onClick={handleDetectLocation}
          disabled={isLocating}
          className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl font-bold text-xs uppercase tracking-wider border transition-all duration-300 transform active:scale-95 ${isLocating
            ? "bg-emerald-100 text-emerald-600 border-emerald-200 cursor-default"
            : "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200 cursor-pointer"
            }`}
        >
          <Compass className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
          {isLocating ? "Locating GPS..." : "Detect My Location"}
        </button>
      </div>

      {/* Large Input Search Box */}
      <div className="relative mb-8 group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search for a neighborhood, estate, or LGA..."
          className="w-full h-14 pl-12 pr-4 rounded-3xl border border-slate-100 bg-white/70 backdrop-blur-md placeholder-slate-400 focus:outline-none focus:border-slate-200 focus:ring-1 focus:ring-slate-200 glass-shadow text-sm font-medium transition-all"
        />
      </div>

      {/* Geolocation toast is handled dynamically by react-hot-toast */}

      {/* Near Your Current Location Grid */}
      {!searchQuery && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Compass className="h-5 w-5 text-emerald-500 stroke-[2.25]" />
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Near Your Current Location
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {nearYouAreas.map((area) => (
              <div
                key={area.id}
                onClick={() => handleSelectArea(area.id)}
                className={`rounded-3xl border p-6 backdrop-blur-md cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 flex flex-col justify-between min-h-[140px] glass-shadow ${selectedAreaId === area.id
                  ? "bg-white border-emerald-200 ring-2 ring-emerald-50"
                  : "bg-white/70 border-slate-100 hover:border-slate-200"
                  }`}
              >
                {/* Header Title and Status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-800 tracking-tight">
                      {area.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {area.description}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${getBadgeColor(area.status)}`}>
                    {area.status === "stable" ? "ONLINE" : area.status === "outage" ? "OUTAGE" : "FLUCTUATING"}
                  </span>
                </div>

                {/* Body metadata / Avatar stack */}
                <div className="flex items-center justify-between gap-4 mt-6 border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-2">
                    {/* Avatars Stack (Yaba) */}
                    {area.avatars && area.avatars.length > 0 ? (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {area.avatars.map((av, idx) => (
                          <div key={idx} className="relative h-5 w-5 rounded-full ring-2 ring-white overflow-hidden">
                            <Image src={av} fill sizes="20px" alt="Active user avatar" className="object-cover" />
                          </div>
                        ))}
                        {area.avatarExtra && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-extrabold text-slate-500 ring-2 ring-white">
                            {area.avatarExtra}
                          </span>
                        )}
                      </div>
                    ) : area.customInfo ? (
                      <span className={`text-[10px] font-extrabold uppercase tracking-wide ${area.status === "outage" ? "text-red-500" : "text-amber-500"
                        }`}>
                        {area.customInfo}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">No events</span>
                    )}

                    {area.confirmations > 0 && (
                      <span className="text-[9px] font-bold text-slate-400">
                        {area.confirmations} confirms
                      </span>
                    )}
                  </div>

                  <span className="text-[9px] font-bold text-slate-400">
                    {area.timeAgo}
                  </span>
                </div>

              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alphabetized All Areas Section */}
      <section>
        <div className="flex items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Grid className="h-5 w-5 text-slate-400 stroke-[2.25]" />
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
              All Areas
            </h2>
          </div>

          {/* Toggle view options */}
          <div className="flex items-center border border-slate-100 bg-slate-50/50 p-1 rounded-xl glass-shadow">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-emerald-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white text-emerald-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Directory Alpha Groups */}
        <div className="flex flex-col gap-6">
          {Object.keys(alphabetizedGroups).map((letter) => (
            <div
              key={letter}
              className="flex flex-col md:flex-row gap-4 md:gap-8 border-b border-slate-100/50 pb-6 last:border-0 last:pb-0"
            >
              {/* Alpha Indicator Anchor */}
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <span className="text-lg font-extrabold text-slate-400 leading-none">
                  {letter}
                </span>
              </div>

              {/* Grid / List of Area buttons */}
              <div className={`flex-1 ${viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-4 gap-3.5"
                : "flex flex-col gap-2"
                }`}>
                {alphabetizedGroups[letter].map((area) => (
                  <button
                    key={area.id}
                    onClick={() => handleSelectArea(area.id)}
                    className={`flex items-center justify-between text-left transition-all duration-200 transform active:scale-98 glass-shadow ${viewMode === "grid"
                      ? `h-12 px-4 rounded-xl border font-bold text-xs text-slate-700 bg-white/70 hover:bg-white border-slate-100 hover:border-slate-200 hover:-translate-y-0.5 ${selectedAreaId === area.id ? "ring-2 ring-emerald-100 border-emerald-200 bg-white" : ""
                      }`
                      : `py-2.5 px-4 rounded-xl border text-xs font-bold text-slate-700 bg-white/70 hover:bg-white border-slate-100 hover:border-slate-200 ${selectedAreaId === area.id ? "ring-2 ring-emerald-100 border-emerald-200 bg-white" : ""
                      }`
                      }`}
                  >
                    <span className="truncate pr-2">{area.name}</span>
                    <span className={`h-2 w-2 rounded-full ${getDotColor(area.status)} shrink-0`} />
                  </button>
                ))}
              </div>

            </div>
          ))}

          {/* Search Empty State */}
          {Object.keys(alphabetizedGroups).length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Search className="h-8 w-8 stroke-[1.5]" />
              <p className="text-xs font-bold uppercase tracking-wider">
                No neighborhoods found matching &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Centered Desktop Live Map Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 hidden md:block">
        <Link
          href="/map"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <MapIcon className="h-4 w-4 text-emerald-400" />
          <span>View Integrated Live Map</span>
        </Link>
      </div>

    </main>
  );
}
