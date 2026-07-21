"use client";

import { useAppSelector } from "@/store";
import { Zap, ZapOff, AlertTriangle, HelpCircle, Clock, Activity, MapPin, Users } from "lucide-react";
import { getAreaStatusFromReports, isReportExpired } from "@/lib/db";
import { useMemo } from "react";

export default function StatusCard() {
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const areas = useAppSelector((state) => state.data.areas);
  const reports = useAppSelector((state) => state.data.reports);
  const loading = useAppSelector((state) => state.data.loading);

  const activeArea = useMemo(() => {
    if (!selectedAreaId) return { id: "none", name: "Detecting location...", last_reported_at: null };
    return areas.find(a => a.id === selectedAreaId) || { id: "none", name: "Detecting location...", last_reported_at: null };
  }, [areas, selectedAreaId]);

  // All reports for this area in last 24h (from Redux)
  const areaReports24h = useMemo(() => {
    if (activeArea.id === "none") return [];
    return reports.filter(r => r.area_id === activeArea.id);
  }, [reports, activeArea]);

  const activeAreaReports = useMemo(() => {
    return areaReports24h.filter(r => !isReportExpired(r));
  }, [areaReports24h]);

  const currentStatus = useMemo(() => {
    // Prioritize computed status from local reports (which includes newly submitted reports immediately)
    const computedStatus = getAreaStatusFromReports(activeArea.id, reports);
    if (computedStatus !== "UNKNOWN") {
      return computedStatus;
    }
    // Fallback to the cached backend aggregated status
    const cachedStatus = (activeArea as any).current_status;
    if (cachedStatus && cachedStatus !== "UNKNOWN") {
      return cachedStatus;
    }
    return "UNKNOWN";
  }, [(activeArea as any).current_status, activeArea.id, reports]);

  // Metrics
  const lastUpdatedText = useMemo(() => {
    if (activeAreaReports.length === 0) {
      if (activeArea.last_reported_at) {
        const diffMins = Math.max(1, Math.round((Date.now() - new Date(activeArea.last_reported_at).getTime()) / (1000 * 60)));
        if (diffMins > 60) return `Last active ${Math.round(diffMins/60)}h ago`;
        return `Last active ${diffMins}m ago`;
      }
      return "No recent activity";
    }
    const latest = [...activeAreaReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const diffMins = Math.max(1, Math.round((Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60)));
    return `Updated ${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  }, [activeAreaReports, activeArea.last_reported_at]);

  const communityConfirmations = useMemo(() => {
    return areaReports24h.reduce((sum, r) => sum + r.confidence_score, 0);
  }, [areaReports24h]);

  const activeAreasCount = useMemo(() => {
    return new Set(reports.map(r => r.area_id)).size;
  }, [reports]);

  const statusConfig = {
    "LIGHT_AVAILABLE": {
      title: "Online",
      badgeTitle: "LIGHT AVAILABLE",
      bgClass: "bg-emerald-50 text-emerald-500 border border-emerald-100/30",
      desktopCircleClass: "bg-[#22c55e] text-[#064e3b]",
      textClass: "text-emerald-500",
      indicatorBg: "bg-emerald-500",
      icon: Zap,
    },
    "LIGHT_OUT": {
      title: "Offline",
      badgeTitle: "LIGHT OUT",
      bgClass: "bg-red-50 text-red-500 border border-red-100/30",
      desktopCircleClass: "bg-[#ef4444] text-[#450a0a]",
      textClass: "text-red-500",
      indicatorBg: "bg-red-500",
      icon: ZapOff,
    },
    "LOW_VOLTAGE": {
      title: "Unstable",
      badgeTitle: "LOW VOLTAGE",
      bgClass: "bg-amber-50 text-amber-500 border border-amber-100/30",
      desktopCircleClass: "bg-[#f59e0b] text-[#451a03]",
      textClass: "text-amber-500",
      indicatorBg: "bg-amber-500",
      icon: AlertTriangle,
    },
    unknown: {
      title: "Unknown",
      badgeTitle: "NO STATUS DATA",
      bgClass: "bg-slate-50 text-slate-500 border border-slate-100/30",
      desktopCircleClass: "bg-slate-400 text-slate-900",
      textClass: "text-slate-500",
      indicatorBg: "bg-slate-400",
      icon: HelpCircle,
    }
  };

  const currentConfig = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.unknown;
  const StatusIcon = currentConfig.icon;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative w-full min-h-[160px] animate-pulse">
        <div className="hidden md:flex flex-col gap-3 flex-1 w-full">
          <div className="h-4 w-24 bg-slate-200 rounded-full"></div>
          <div className="h-8 w-64 bg-slate-200 rounded-lg mt-2"></div>
          <div className="h-4 w-48 bg-slate-200 rounded-md mt-4"></div>
        </div>
        <div className="h-36 w-36 rounded-full bg-slate-200"></div>
      </div>
    );
  }

  // Empty State / No Data
  if (areaReports24h.length === 0 && activeArea.id !== "none") {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden w-full">
        <div className="flex flex-col items-center justify-center text-center w-full py-4 gap-4">
          <HelpCircle className="h-12 w-12 text-slate-300 stroke-[1.5]" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-700">Waiting for community reports</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              No reports have been submitted for {activeArea.name} in the last 24 hours. Be the first to report the current power status.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden w-full">
      
      <div className={`absolute inset-0 bg-linear-to-b opacity-5 pointer-events-none ${
        currentStatus === "LIGHT_AVAILABLE" ? "from-emerald-500" :
        currentStatus === "LIGHT_OUT" ? "from-red-500" :
        currentStatus === "LOW_VOLTAGE" ? "from-amber-500" : "from-slate-500"
      } to-transparent`} />

      {/* MOBILE */}
      <div className="flex flex-col items-center justify-center gap-6 text-center md:hidden w-full">
        <div className={`h-28 w-28 rounded-full flex items-center justify-center shadow-inner transition-transform duration-500 hover:scale-105 ${currentConfig.bgClass}`}>
          <StatusIcon className="h-14 w-14 stroke-[2.25] fill-current" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className={`text-base font-extrabold tracking-wider uppercase ${currentConfig.textClass}`}>
            {currentConfig.badgeTitle}
          </h2>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mt-1">
            <Clock className="h-4 w-4 stroke-[2.25]" />
            <span>{lastUpdatedText}</span>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex flex-col gap-4 items-start text-left z-10 flex-1 w-full">
        <div>
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-emerald-50/70 text-[#15803d] border border-emerald-100/30">
            CURRENT STATUS
          </span>
        </div>
        
        <div className="flex flex-col gap-1.5 mt-1">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
            {activeArea.name} is <span className={`${currentConfig.textClass} font-semibold`}>{currentConfig.title}</span>
          </h2>
          
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-2">
            <span className={`h-2.5 w-2.5 rounded-full ${currentConfig.indicatorBg}`} />
            <span>{lastUpdatedText}</span>
          </div>
        </div>

        {/* Real Metrics Row */}
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 w-full">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            <Activity className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span><strong className="text-slate-800 dark:text-slate-100">{areaReports24h.length}</strong> reports in 24h</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span><strong className="text-slate-800 dark:text-slate-100">{communityConfirmations}</strong> verifications</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span><strong className="text-slate-800 dark:text-slate-100">{activeAreasCount}</strong> global areas active</span>
          </div>
        </div>
      </div>

      <div className="hidden md:block relative z-10 shrink-0">
        <div className={`h-36 w-36 sm:h-40 sm:w-40 rounded-full flex items-center justify-center transition-all duration-500 ${currentConfig.desktopCircleClass}`}>
          <StatusIcon className="h-16 w-16 stroke-[2.25] fill-current" />
        </div>
      </div>

    </div>
  );
}
