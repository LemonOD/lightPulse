"use client";

import Link from "next/link";
import { Map as MapIcon, Zap } from "lucide-react";
import { useAppSelector } from "@/store";
import { getHaversineDistance } from "@/lib/geolocation";
import { getAreaStatusFromReports } from "@/lib/db";
import { useMemo } from "react";

export default function MapPreview() {
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const areas = useAppSelector((state) => state.data.areas);
  const reports = useAppSelector((state) => state.data.reports);
  const userLocation = useAppSelector((state) => state.app.userLocation);

  const getStatusDotClass = (status: string) => {
    if (status === "LIGHT_AVAILABLE") return "bg-emerald-500";
    if (status === "LIGHT_OUT") return "bg-red-500";
    if (status === "LOW_VOLTAGE") return "bg-amber-500";
    return "bg-slate-400";
  };

  const getBadgeStyle = (status: string) => {
    if (status === "LIGHT_AVAILABLE") return "border-emerald-100/50 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (status === "LIGHT_OUT") return "border-red-100/50 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400";
    if (status === "LOW_VOLTAGE") return "border-amber-100/50 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "border-slate-100/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400";
  };

  // Dynamically resolve nearby areas mirroring user's location coordinates
  const nearbyAreas = useMemo(() => {
    const uniqueAreasMap = new Map<string, typeof areas[0]>();
    areas.forEach(a => {
      const normalizedName = a.name.toLowerCase().trim();
      const existing = uniqueAreasMap.get(normalizedName);
      
      if (!existing) {
        uniqueAreasMap.set(normalizedName, a);
      } else {
        if (a.id === selectedAreaId) {
          uniqueAreasMap.set(normalizedName, a);
        } else if (existing.id !== selectedAreaId) {
          const newReport = reports.find(r => r.area_id === a.id);
          const existingReport = reports.find(r => r.area_id === existing.id);
          
          if (newReport && !existingReport) {
            uniqueAreasMap.set(normalizedName, a);
          } else if (newReport && existingReport) {
            if (new Date(newReport.created_at) > new Date(existingReport.created_at)) {
              uniqueAreasMap.set(normalizedName, a);
            }
          }
        }
      }
    });
    const uniqueAreas = Array.from(uniqueAreasMap.values());

    const areasWithStatus = uniqueAreas.map(area => {
      const status = getAreaStatusFromReports(area.id, reports);
      let distance = Infinity;
      if (userLocation) {
        distance = getHaversineDistance(userLocation[0], userLocation[1], area.lat, area.lng);
      }
      return { ...area, status, distance };
    });

    if (userLocation) {
      // Sort mathematically by proximity to user GPS coordinates
      return areasWithStatus.sort((a, b) => a.distance - b.distance).slice(0, 4);
    }

    // Default mock areas matching primary Lagos hub landmarks if GPS not resolved/cached yet
    const targetNames = ["Ojuelegba Cross", "Akoka Finbarrs", "Yaba Tech", "Sabo Yaba"];
    const matched = areasWithStatus.filter(a => targetNames.includes(a.name));
    if (matched.length >= 4) return matched.slice(0, 4);
    return areasWithStatus.slice(0, 4);
  }, [areas, reports, userLocation]);

  return (
    <>
      <Link
        href="/map"
        className="flex md:hidden relative h-32 w-full rounded-2xl overflow-hidden items-center justify-center group border-0 shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer"
      >
        <svg className="absolute inset-0 h-full w-full stroke-slate-800/40 fill-none stroke-2" viewBox="0 0 320 128">
          <path d="M-10 64 C90 64 130 24 210 44 C290 64 230 114 330 84" />
          <path d="M110 0 C130 44 90 84 160 128" />
          <path d="M40 0 C70 50 180 50 200 128" />
          <path d="M0 100 C150 100 150 20 320 20" />
          
          <circle cx="130" cy="44" r="3" className={`${nearbyAreas[0]?.status === "LIGHT_AVAILABLE" ? "fill-emerald-400 stroke-emerald-950 animate-pulse" : nearbyAreas[0]?.status === "LIGHT_OUT" ? "fill-red-500 stroke-red-950" : "fill-amber-500 stroke-amber-950"} stroke-1`} />
          <circle cx="220" cy="49" r="3" className={`${nearbyAreas[1]?.status === "LIGHT_AVAILABLE" ? "fill-emerald-400 stroke-emerald-950 animate-pulse" : nearbyAreas[1]?.status === "LIGHT_OUT" ? "fill-red-500 stroke-red-950" : "fill-amber-500 stroke-amber-950"} stroke-1`} />
          <circle cx="165" cy="85" r="3" className={`${nearbyAreas[2]?.status === "LIGHT_AVAILABLE" ? "fill-emerald-400 stroke-emerald-950 animate-pulse" : nearbyAreas[2]?.status === "LIGHT_OUT" ? "fill-red-500 stroke-red-950" : "fill-amber-500 stroke-amber-950"} stroke-1`} />
        </svg>

        <div className="absolute flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-105 z-10 select-none">
          <MapIcon className="h-4 w-4 text-emerald-500 stroke-[2.25]" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
            Explore Local Grid
          </span>
        </div>
      </Link>

      <div className="hidden md:flex flex-col w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-300">
        
        <Link
          href="/map"
          className="relative h-44 w-full bg-[#e8f1f7] dark:bg-slate-800 overflow-hidden flex items-end p-5 group cursor-pointer border-b border-slate-100 dark:border-slate-800"
        >
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-103">
            
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 320 176">
              <path d="M 0 140 Q 120 120 180 150 T 320 110 L 320 176 L 0 176 Z" className="fill-[#cbe2f4] dark:fill-slate-700" />
              <path d="M 220 0 Q 250 40 320 30 L 320 0 Z" className="fill-[#cbe2f4] dark:fill-slate-700" />
            </svg>

            <svg className="absolute inset-0 h-full w-full stroke-white/80 fill-none stroke-[2.5]" viewBox="0 0 320 176">
              <path d="M-10 70 C80 70 120 30 200 50 C280 70 240 120 330 90" />
              <path d="M120 0 C140 50 100 90 170 176" />
              <path d="M40 0 C70 60 190 60 210 176" />
              <path d="M0 110 C160 110 160 30 320 30" />
            </svg>

            <svg className="absolute inset-0 h-full w-full stroke-slate-200/50 fill-none stroke-[1.2]" viewBox="0 0 320 176">
              <path d="M 30 0 L 30 176" />
              <path d="M 260 0 L 260 176" />
              <path d="M 0 50 L 320 50" />
              <path d="M 0 130 L 320 130" />
            </svg>

            {/* Dynamic Map Labels that mirror actual coordinates near the user */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full text-[10px] font-bold">
              
              {nearbyAreas[0] && (
                <div className="absolute top-4 right-14 flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full border border-white ${getStatusDotClass(nearbyAreas[0].status)}`} />
                  <span className="text-[7px] text-slate-400 font-extrabold uppercase truncate max-w-[80px]">
                    {nearbyAreas[0].name}
                  </span>
                </div>
              )}
              
              {nearbyAreas[1] && (
                <div className="absolute top-10 left-6 flex flex-col items-start leading-none">
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-[11px] tracking-tight truncate max-w-[80px]">
                    {nearbyAreas[1].name}
                  </span>
                  <span className={`h-2 w-2 rounded-full border border-white mt-1 ${getStatusDotClass(nearbyAreas[1].status)}`} />
                </div>
              )}

              {nearbyAreas[2] && (
                <div className="absolute top-14 right-20 flex flex-col items-center">
                  <span className="text-slate-800 dark:text-slate-200 font-black text-xs tracking-tight leading-none truncate max-w-[90px]">
                    {nearbyAreas[2].name}
                  </span>
                  <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-0.5">Nearby</span>
                  <span className={`h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white mt-1 ${
                    nearbyAreas[2].status === "LIGHT_AVAILABLE" ? "animate-pulse" : ""
                  } ${getStatusDotClass(nearbyAreas[2].status)}`}>
                    <Zap className="h-2 w-2 fill-white stroke-[2.5]" />
                  </span>
                </div>
              )}

              {nearbyAreas[3] && (
                <div className="absolute bottom-10 right-8 flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full border border-white ${getStatusDotClass(nearbyAreas[3].status)}`} />
                  <span className="text-[7px] text-slate-400 font-extrabold uppercase truncate max-w-[80px]">
                    {nearbyAreas[3].name}
                  </span>
                </div>
              )}
            </div>

          </div>

          <div className="absolute inset-0 bg-slate-900/10 transition-colors duration-300 group-hover:bg-slate-900/0" />

          <div className="absolute bottom-4 left-5 z-10 flex flex-col gap-0.5 text-left">
            <span className="text-sm font-extrabold text-white tracking-tight leading-none drop-shadow-sm">
              Neighborhood View
            </span>
            <span className="text-[10px] font-bold text-slate-200 tracking-wide drop-shadow-sm">
              Tap to expand full map
            </span>
          </div>

        </Link>

        {/* Bottom Half: Status List table matching mockup perfectly */}
        <div className="p-5 flex flex-col gap-3.5 bg-white dark:bg-slate-900">
          {nearbyAreas.slice(0, 3).map((area) => (
            <div key={area.id} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2.5 last:border-0 last:pb-0">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 tracking-tight">
                {area.name}
              </span>
              <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${getBadgeStyle(area.status)}`}>
                {area.status === "LIGHT_AVAILABLE" ? "ONLINE" : area.status === "LIGHT_OUT" ? "OFFLINE" : area.status === "LOW_VOLTAGE" ? "UNSTABLE" : "UNKNOWN"}
              </span>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
