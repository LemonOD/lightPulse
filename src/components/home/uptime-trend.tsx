"use client";

import { useAppSelector } from "@/store";
import { useMemo } from "react";
import { MOCK_UPTIME_TRENDS } from "@/lib/mockData";
import { ArrowUp } from "lucide-react";

export default function UptimeTrend() {
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const areas = useAppSelector((state) => state.data.areas);

  const activeArea = useMemo(() => {
    return areas.find(a => a.id === selectedAreaId) || areas[0] || { name: "Yaba", slug: "yaba" };
  }, [areas, selectedAreaId]);

  // Load appropriate trend based on area slug, default to mainland aggregated trend
  const uptimeData = useMemo(() => {
    return MOCK_UPTIME_TRENDS[activeArea.slug] || MOCK_UPTIME_TRENDS["Lagos Mainland"];
  }, [activeArea]);

  // Calculate dynamic metrics
  const avgHours = useMemo(() => {
    // Return mock values aligning with the UI designs or compute dynamically
    if (activeArea.name === "Yaba") return "18.4";
    if (activeArea.name === "Sabo") return "4.2";
    if (activeArea.name === "Iwaya") return "11.8";
    return "14.2";
  }, [activeArea]);

  const percentageTrend = useMemo(() => {
    if (activeArea.name === "Sabo") return "-32% from last week";
    if (activeArea.name === "Iwaya") return "+4% from last week";
    return "+12% from last week";
  }, [activeArea]);

  const isPositive = !percentageTrend.startsWith("-");

  // CSS bar height mapper based on status to add visual variation
  const getBarHeight = (status: string, index: number) => {
    // Ensure varied heights matching visual aesthetics in screenshot
    if (status === "outage") return "h-[20%] sm:h-[25%]";
    if (status === "unstable") return "h-[50%] sm:h-[60%]";
    if (status === "unknown") return "h-[35%] sm:h-[40%]";
    
    // Vary stable bars slightly for premium organic look
    const heights = ["h-[75%]", "h-[85%]", "h-[95%]", "h-[80%]", "h-[90%]"];
    return heights[index % heights.length];
  };

  const getBarColor = (status: string) => {
    if (status === "stable") return "bg-emerald-500 hover:bg-emerald-400";
    if (status === "outage") return "bg-red-500 hover:bg-red-400";
    if (status === "unstable") return "bg-amber-500 hover:bg-amber-400";
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

        {/* Beautiful visual chart with animated vertical columns */}
        <div className="h-44 w-full flex items-end gap-2.5 sm:gap-4 px-2 py-4">
          {uptimeData.map((item, idx) => (
            <div
              key={idx}
              className="flex-1 h-full flex flex-col items-center justify-end group/bar relative"
            >
              {/* Dynamic Bar */}
              <div className={`w-full rounded-t-lg transition-all duration-700 ease-out cursor-pointer ${getBarHeight(item.status, idx)} ${getBarColor(item.status)}`} />
              
              {/* Micro tooltip */}
              <div className="absolute bottom-full mb-1 opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity duration-200 scale-95 origin-bottom bg-slate-900 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-1 rounded-lg shadow-md z-30 flex flex-col items-center">
                <span>{item.hour}</span>
                <span className={
                  item.status === "stable" ? "text-emerald-400" :
                  item.status === "outage" ? "text-red-400" :
                  item.status === "unstable" ? "text-amber-400" : "text-slate-400"
                }>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Card (Dark Navy background exactly matching mockup) */}
      <div className="rounded-xl bg-slate-900 p-6 backdrop-blur-md flex flex-col justify-center items-center relative overflow-hidden group">
        
        {/* Subtle geometric circle highlight in dark card */}
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
