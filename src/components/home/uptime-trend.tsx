"use client";

import { useAppSelector } from "@/store";
import { useMemo } from "react";
import { UptimeHour, ReportStatus, Report, getDisplayStatus } from "@/lib/types";
import { ArrowUp } from "lucide-react";

export default function UptimeTrend() {
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const areas = useAppSelector((state) => state.data.areas);
  const allReports = useAppSelector((state) => state.data.reports);

  const activeArea = useMemo(() => {
    return areas.find(a => a.id === selectedAreaId) || areas[0] || { id: "none", name: "Unknown", slug: "UNKNOWN" };
  }, [areas, selectedAreaId]);

  // Compute actual dynamic trend based on real data
  const uptimeData = useMemo(() => {
    const defaultData: UptimeHour[] = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - (11 - i) * 2);
      return {
        hour: d.getHours() + ":00",
        status: "UNKNOWN" as ReportStatus
      };
    });

    if (activeArea.id === "none") return defaultData;

    const areaReports = allReports.filter(r => r.area_id === activeArea.id);
    if (areaReports.length === 0) return defaultData;

    // Build the 24h timeline (12 bins of 2 hours) based on reports
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const binStart = new Date(now.getTime() - (12 - i) * 2 * 60 * 60 * 1000);
      const binEnd = new Date(now.getTime() - (11 - i) * 2 * 60 * 60 * 1000);

      // Find report in this bin
      const reportInBin = areaReports.find(r => {
        const rDate = new Date(r.created_at);
        return rDate >= binStart && rDate <= binEnd;
      });

      if (reportInBin) {
        defaultData[i].status = reportInBin.status;
      } else {
        // If no report in this bin, carry over previous bin's status if < 2 hours old,
        // but since bins are 2 hours wide, we just mark it unknown (stale) unless it's index 0
        if (i > 0 && defaultData[i - 1].status !== "UNKNOWN") {
             // For a true system, we might carry it over, but to respect the 2 hour staleness rule:
             defaultData[i].status = "UNKNOWN";
        }
      }
    }

    return defaultData;
  }, [activeArea, allReports]);

  // Calculate dynamic metrics from the generated timeline
  const avgHours = useMemo(() => {
    const availableBins = uptimeData.filter(d => d.status === "LIGHT_AVAILABLE").length;
    if (availableBins === 0) return "0.0";
    return (availableBins * 2).toFixed(1); // Each bin is 2 hours
  }, [uptimeData]);

  const percentageTrend = useMemo(() => {
    // We don't have historical weekly data in this simple client-side calc
    // So we just show 0% if no data, or a placeholder if there is data.
    if (avgHours === "0.0") return "0% from last week";
    return "+0% from last week"; 
  }, [avgHours]);

  const isPositive = !percentageTrend.startsWith("-");

  // CSS bar height mapper based on status
  const getBarHeight = (status: string, index: number) => {
    if (status === "LIGHT_OUT") return "h-[20%] sm:h-[25%]";
    if (status === "LOW_VOLTAGE") return "h-[50%] sm:h-[60%]";
    if (status === "UNKNOWN") return "h-[35%] sm:h-[40%]";
    
    const heights = ["h-[75%]", "h-[85%]", "h-[95%]", "h-[80%]", "h-[90%]"];
    return heights[index % heights.length];
  };

  const getBarColor = (status: string) => {
    if (status === "LIGHT_AVAILABLE") return "bg-emerald-500 hover:bg-emerald-400";
    if (status === "LIGHT_OUT") return "bg-red-500 hover:bg-red-400";
    if (status === "LOW_VOLTAGE") return "bg-amber-500 hover:bg-amber-400";
    return "bg-slate-300 hover:bg-slate-200";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      {/* 24h Trend Chart Container */}
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm text-slate-800 tracking-tight">
            Uptime Trend (24h)
          </h4>
        </div>

        {/* Visual chart */}
        <div className="h-44 w-full flex items-end gap-2.5 sm:gap-4 px-2 py-4">
          {uptimeData.map((item, idx) => (
            <div
              key={idx}
              className="flex-1 h-full flex flex-col items-center justify-end group/bar relative"
            >
              <div className={`w-full rounded-t-lg transition-all duration-700 ease-out cursor-pointer ${getBarHeight(item.status, idx)} ${getBarColor(item.status)}`} />
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity duration-200 scale-95 origin-bottom bg-slate-900 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-1 rounded-lg shadow-md z-30 flex flex-col items-center whitespace-nowrap">
                <span>{item.hour}</span>
                <span className={
                  item.status === "LIGHT_AVAILABLE" ? "text-emerald-400" :
                  item.status === "LIGHT_OUT" ? "text-red-400" :
                  item.status === "LOW_VOLTAGE" ? "text-amber-400" : "text-slate-400"
                }>{getDisplayStatus(item.status)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Card */}
      <div className="rounded-xl bg-slate-900 p-6 backdrop-blur-md flex flex-col justify-center items-center relative overflow-hidden group">
        <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-slate-800 opacity-50 blur-xl group-hover:scale-110 transition-transform duration-300" />

        <div className="flex flex-col z-10">
          <div className="flex justify-center item-center gap-1 mt-2">
            <span className="text-sm tracking-tight text-emerald-400">
              {avgHours}
            </span>
          </div>
          <span className="text-md font-bold text-slate-300">
            Avg. Daily Hours
          </span>
        </div>

        <div className="z-10 mt-2 flex items-center justify-between">
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}>
            <ArrowUp className={`h-3.5 w-3.5 ${isPositive ? "" : "rotate-180"}`} />
            <span>{percentageTrend.split(" ")[0]} </span>
          </div>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
            From last week
          </span>
        </div>
      </div>

    </div>
  );
}
