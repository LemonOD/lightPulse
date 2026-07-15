"use client";

import { useAppSelector, useAppDispatch } from "@/store";
import { useMemo, useState, useEffect, useRef } from "react";
import { UptimeHour, ReportStatus, Report, getDisplayStatus } from "@/lib/types";
import { ArrowUp, Loader2 } from "lucide-react";
import { fetchHistoricalData } from "@/store/slices/dataSlice";

type Timeframe = "24H" | "7D" | "30D" | "90D" | "1Y";

export default function UptimeTrend() {
  const dispatch = useAppDispatch();
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const areas = useAppSelector((state) => state.data.areas);
  const allReports = useAppSelector((state) => state.data.reports);
  const historicalReports = useAppSelector((state) => state.data.historicalReports);
  const historicalLoading = useAppSelector((state) => state.data.historicalLoading);

  const [timeframe, setTimeframe] = useState<Timeframe>("24H");
  const fetchedMapRef = useRef<Record<string, number>>({});

  const activeArea = useMemo(() => {
    return areas.find(a => a.id === selectedAreaId) || { id: "none", name: "Unknown Area", slug: "UNKNOWN" };
  }, [areas, selectedAreaId]);

  useEffect(() => {
    if (activeArea.id !== "none" && timeframe !== "24H") {
      let daysToFetch = 0;
      if (timeframe === "7D") daysToFetch = 7;
      else if (timeframe === "30D") daysToFetch = 30;
      else if (timeframe === "90D") daysToFetch = 90;
      else if (timeframe === "1Y") daysToFetch = 365;

      const maxFetched = fetchedMapRef.current[activeArea.id] || 0;
      
      if (daysToFetch > maxFetched) {
        dispatch(fetchHistoricalData({ areaId: activeArea.id, days: daysToFetch }));
        fetchedMapRef.current[activeArea.id] = daysToFetch;
      }
    }
  }, [timeframe, activeArea.id, dispatch]);

  // Compute actual dynamic trend based on real data
  const uptimeData = useMemo(() => {
    const isHistorical = timeframe !== "24H";
    const areaReports = isHistorical 
      ? (historicalReports[activeArea.id] || allReports.filter(r => r.area_id === activeArea.id))
      : allReports.filter(r => r.area_id === activeArea.id);

    if (timeframe === "24H") {
      const defaultData: UptimeHour[] = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setHours(d.getHours() - (11 - i) * 2);
        return {
          hour: d.getHours() + ":00",
          status: "UNKNOWN" as ReportStatus
        };
      });

      if (activeArea.id === "none" || areaReports.length === 0) return defaultData;

      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const binStart = new Date(now.getTime() - (12 - i) * 2 * 60 * 60 * 1000);
        const binEnd = new Date(now.getTime() - (11 - i) * 2 * 60 * 60 * 1000);
        
        const reportsInBin = areaReports.filter(r => {
          const rDate = new Date(r.created_at);
          return rDate > binStart && rDate <= binEnd;
        });

        const reportBeforeBin = areaReports.find(r => {
          const rDate = new Date(r.created_at);
          return rDate <= binStart;
        });

        const startingStatus = reportBeforeBin ? reportBeforeBin.status : "UNKNOWN";

        if (reportsInBin.length === 0) {
          defaultData[i].status = startingStatus as ReportStatus;
        } else {
          // In a 2-hour window, ensure any outage is visible to the user
          const hasOutage = startingStatus === "LIGHT_OUT" || reportsInBin.some(r => r.status === "LIGHT_OUT");
          const hasLowVoltage = startingStatus === "LOW_VOLTAGE" || reportsInBin.some(r => r.status === "LOW_VOLTAGE");
          const hasAvailable = startingStatus === "LIGHT_AVAILABLE" || reportsInBin.some(r => r.status === "LIGHT_AVAILABLE");

          if (hasOutage) defaultData[i].status = "LIGHT_OUT";
          else if (hasLowVoltage) defaultData[i].status = "LOW_VOLTAGE";
          else if (hasAvailable) defaultData[i].status = "LIGHT_AVAILABLE";
          else defaultData[i].status = "UNKNOWN";
        }
      }
      return defaultData;
    }

    {
      let totalDays = 0;
      let numBins = 0;

      if (timeframe === "7D") { totalDays = 7; numBins = 7; }
      else if (timeframe === "30D") { totalDays = 30; numBins = 30; }
      else if (timeframe === "90D") { totalDays = 90; numBins = 30; }
      else if (timeframe === "1Y") { totalDays = 365; numBins = 12; }
      
      const binSizeDays = totalDays / numBins;

      const defaultData: UptimeHour[] = Array.from({ length: numBins }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - Math.round((numBins - 1 - i) * binSizeDays));
        return {
          hour: timeframe === "1Y" 
            ? d.toLocaleDateString('en-US', { month: 'short' })
            : timeframe === "90D"
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          status: "UNKNOWN" as ReportStatus
        };
      });

      if (activeArea.id === "none" || areaReports.length === 0) return defaultData;

      const now = new Date();
      for (let i = 0; i < numBins; i++) {
        const binStart = new Date(now.getTime() - (numBins - i) * binSizeDays * 24 * 60 * 60 * 1000);
        const binEnd = new Date(now.getTime() - (numBins - 1 - i) * binSizeDays * 24 * 60 * 60 * 1000);
        
        const reportInBin = areaReports.find(r => {
          const rDate = new Date(r.created_at);
          return rDate > binStart && rDate <= binEnd;
        });

        const reportBeforeBin = areaReports.find(r => {
          const rDate = new Date(r.created_at);
          return rDate <= binStart;
        });

        const activeReport = reportInBin || reportBeforeBin;

        if (activeReport) {
          defaultData[i].status = activeReport.status;
        }
      }
      return defaultData;
    }
    
    return [];
  }, [activeArea, allReports, historicalReports, timeframe]);

  // Calculate dynamic metrics from the generated timeline
  const avgHours = useMemo(() => {
    const availableBins = uptimeData.filter(d => d.status === "LIGHT_AVAILABLE").length;
    if (availableBins === 0) return "0.0";
    if (timeframe === "24H") return (availableBins * 2).toFixed(1);
    
    // For historical, a bin represents binSizeDays. 
    // If a bin is "LIGHT_AVAILABLE", say it had roughly 12 hours of power.
    // Realistically, we'd need hourly data to compute exactly, but for this demo:
    const numBins = timeframe === "24H" ? 12 : (timeframe === "1Y" ? 12 : (timeframe === "7D" ? 7 : 30));
    return (availableBins * 12 / numBins).toFixed(1);
  }, [uptimeData, timeframe]);

  const percentageTrend = useMemo(() => {
    if (avgHours === "0.0") return "0% from last week";
    return "+0% from last week"; 
  }, [avgHours]);

  const isPositive = !percentageTrend.startsWith("-");

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
      
      {/* Trend Chart Container */}
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md flex flex-col gap-4 relative">
        {historicalLoading && timeframe !== "24H" && (
          <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-500">Fetching History...</span>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <h4 className="text-sm text-slate-800 font-semibold tracking-tight">
              Uptime Trend
            </h4>
            <span className="text-[11px] font-medium text-slate-500">
              Showing history for: <strong className="text-slate-700">{activeArea.name}</strong>
            </span>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(["24H", "7D", "30D", "90D", "1Y"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                  timeframe === tf 
                    ? "bg-white text-slate-800 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Visual chart */}
        <div className="h-44 w-full flex items-end gap-1 sm:gap-2 px-1 sm:px-2 py-4">
          {uptimeData.map((item, idx) => (
            <div
              key={idx}
              className="flex-1 h-full flex flex-col items-center justify-end group/bar relative"
            >
              <div className={`w-full rounded-t-sm sm:rounded-t-lg transition-all duration-700 ease-out cursor-pointer ${getBarHeight(item.status, idx)} ${getBarColor(item.status)}`} />
              
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
            {timeframe === "24H" ? "Avg. Daily Hours" : "Avg. Daily Hours (Est.)"}
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
