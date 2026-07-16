"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedAreaId, setUserLocation } from "@/store/slices/appSlice";
import { Zap, MapPin, Award, ShieldCheck, Trophy, Target } from "lucide-react";
import { useEffect, useMemo } from "react";
import { getPreciseLocation, getHaversineDistance } from "@/lib/geolocation";
import { getDeviceId } from "@/lib/device";
import ThemeToggle from "./toggle-button";

export default function Header() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const currentRegion = useAppSelector((state) => state.app.currentRegion);
  const homeAreaId = useAppSelector((state) => state.app.homeAreaId);
  const areas = useAppSelector((state) => state.data.areas);

  const activeArea = areas.find((a) => a.id === homeAreaId);
  const locationLabel = activeArea ? activeArea.name: currentRegion;

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Map", href: "/map" },
    { name: "Areas", href: "/areas" },
  ];

  const reports = useAppSelector((state) => state.data.reports);

  const { score, level, icon: LevelIcon, colorText } = useMemo(() => {
    let deviceId = "";
    if (typeof window !== "undefined") {
      deviceId = getDeviceId();
    }
    const myReports = reports.filter(r => r.device_id === deviceId);
    const calculatedScore = myReports.reduce((total, r) => {
      return total + 10 + ((r.confidence_score - 1) * 50);
    }, 0);

    if (calculatedScore > 500) return { score: calculatedScore, level: "Community Guardian", icon: Trophy, colorText: "text-amber-500" };
    if (calculatedScore > 100) return { score: calculatedScore, level: "Reliable Scout", icon: ShieldCheck, colorText: "text-emerald-500" };
    if (calculatedScore > 0) return { score: calculatedScore, level: "Active Reporter", icon: Target, colorText: "text-blue-500" };
    return { score: 0, level: "Novice", icon: Award, colorText: "text-slate-400" };
  }, [reports]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md dark:bg-black dark:border-gray-900">
      <div className=" flex  h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex md:hidden w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-emerald-500 font-medium text-base transition-colors select-none">
              <Zap className="h-5 w-5 fill-current" />
              <span>{locationLabel}</span>
            </button>
            <ThemeToggle />
            
            <div className="relative group flex items-center justify-center cursor-help">
              <LevelIcon className={`h-4 w-4 ${colorText}`} />
              <div className="absolute left-0 top-full mt-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-800 text-white p-3 rounded-xl shadow-lg z-50">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Reputation</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${colorText}`}>{level}</span>
                    <span className="text-[10px] font-bold text-emerald-400">{score} XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex w-full items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#22C55E] transition-all duration-300 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white glass-shadow">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900">
                Light<span className="text-[#22C55E]">Pulse</span>
              </span>
            </Link>

            <nav className="flex items-center gap-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-[#22C55E] text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group cursor-help flex items-center justify-center h-8 w-8 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors ">
              <LevelIcon className={`h-4 w-4 ${colorText}`} />
              <div className="absolute right-0 top-full mt-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-800 text-white p-3 rounded-xl shadow-lg z-50">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Reputation</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${colorText}`}>{level}</span>
                    <span className="text-[10px] font-bold text-emerald-400">{score} XP</span>
                  </div>
                  <span className="text-[10px] text-slate-300 mt-1 leading-tight">Earn XP by submitting accurate updates.</span>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all duration-200 glass-shadow">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{locationLabel}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
