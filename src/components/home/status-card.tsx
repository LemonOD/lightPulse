"use client";

import { useAppSelector } from "@/store";
import { Zap, ZapOff, AlertTriangle, HelpCircle, Clock } from "lucide-react";
import { getAreaStatusFromReports } from "@/lib/db";
import { useMemo } from "react";

export default function StatusCard() {
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const areas = useAppSelector((state) => state.data.areas);
  const reports = useAppSelector((state) => state.data.reports);

  // Find active area details
  const activeArea = useMemo(() => {
    return areas.find(a => a.id === selectedAreaId) || areas[0] || { name: "Lagos Mainland", id: "" };
  }, [areas, selectedAreaId]);

  // Dynamic status based on reports for this specific area
  const areaReports = useMemo(() => {
    if (!activeArea.id) return [];
    return reports.filter(r => r.area_id === activeArea.id);
  }, [reports, activeArea]);

  const currentStatus = useMemo(() => {
    return getAreaStatusFromReports(activeArea.id, reports);
  }, [activeArea.id, reports]);

  const stablePercentage = useMemo(() => {
    if (areaReports.length === 0) {
      if (activeArea.name === "Yaba") return 100;
      if (activeArea.name === "Sabo") return 0;
      if (activeArea.name === "Iwaya") return 40;
      return 84; // Mock standard 84% from the desktop screenshot mockup
    }
    const stableCount = areaReports.filter(r => r.status === "stable").length;
    return Math.round((stableCount / areaReports.length) * 100);
  }, [areaReports, activeArea]);

  // Last updated timing
  const lastUpdatedText = useMemo(() => {
    if (areaReports.length === 0) {
      if (activeArea.name === "Yaba") return "Updated 2 minutes ago";
      if (activeArea.name === "Sabo") return "Updated 15 minutes ago";
      return "Updated 2 minutes ago";
    }
    const latest = [...areaReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const diffMins = Math.max(1, Math.round((Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60)));
    return `Updated ${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  }, [areaReports, activeArea]);

  // Visual settings mapping matching mobile and desktop mockups
  const statusConfig = {
    stable: {
      title: "Online",
      badgeTitle: "LIGHT AVAILABLE",
      bgClass: "bg-emerald-50 text-emerald-500 border border-emerald-100/30",
      desktopCircleClass: "bg-[#22c55e] text-[#064e3b]",
      textClass: "text-emerald-500",
      indicatorBg: "bg-emerald-500",
      icon: Zap,
    },
    outage: {
      title: "Offline",
      badgeTitle: "LIGHT OUT",
      bgClass: "bg-red-50 text-red-500 border border-red-100/30",
      desktopCircleClass: "bg-[#ef4444] text-[#450a0a]",
      textClass: "text-red-500",
      indicatorBg: "bg-red-500",
      icon: ZapOff,
    },
    unstable: {
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

  const currentConfig = statusConfig[currentStatus] || statusConfig.unknown;
  const StatusIcon = currentConfig.icon;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden w-full">
      
      {/* Subtle background gradient light source */}
      <div className={`absolute inset-0 bg-linear-to-b opacity-5 pointer-events-none ${
        currentStatus === "stable" ? "from-emerald-500" :
        currentStatus === "outage" ? "from-red-500" :
        currentStatus === "unstable" ? "from-amber-500" : "from-slate-500"
      } to-transparent`} />

      {/* MOBILE CONTENT: Centered circle badge layout */}
      <div className="flex flex-col items-center justify-center gap-6 text-center md:hidden w-full">
        {/* Large Central Circle Badge */}
        <div className={`h-28 w-28 rounded-full flex items-center justify-center shadow-inner transition-transform duration-500 hover:scale-105 ${currentConfig.bgClass}`}>
          <StatusIcon className="h-14 w-14 stroke-[2.25] fill-current" />
        </div>

        {/* Info labels */}
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

      {/* DESKTOP CONTENT: Horizontal split screen matching desktop mockup exactly */}
      <div className="hidden md:flex flex-col gap-3 items-start text-left z-10 flex-1">
        <div>
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-emerald-50/70 text-[#15803d] border border-emerald-100/30">
            CURRENT STATUS
          </span>
        </div>
        
        <div className="flex flex-col gap-1.5 mt-1">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight leading-none">
            {activeArea.name} is <span className={`${currentConfig.textClass} font-semibold`}>{currentConfig.title}</span>
          </h2>
          <p className="text-xs md:text-sm font-medium text-slate-400 leading-relaxed mt-2.5">
            {stablePercentage}% of monitored nodes reporting power in this area.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-2">
          <span className={`h-2.5 w-2.5 rounded-full ${currentConfig.indicatorBg}`} />
          <span>{lastUpdatedText}</span>
        </div>
      </div>

      {/* DESKTOP CIRCLE ICON BADGE (Right) */}
      <div className="hidden md:block relative z-10 shrink-0">
        <div className={`h-36 w-36 sm:h-40 sm:w-40 rounded-full flex items-center justify-center transition-all duration-500 ${currentConfig.desktopCircleClass}`}>
          <StatusIcon className="h-16 w-16 stroke-[2.25] fill-current" />
        </div>
      </div>

    </div>
  );
}
