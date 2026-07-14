"use client";

import { useAppSelector } from "@/store";
import { Award, ShieldCheck, Trophy, Target } from "lucide-react";
import { useMemo } from "react";
import { getDeviceId } from "@/lib/device";

export default function UserProfileCard() {
  const reports = useAppSelector((state) => state.data.reports);

  const { score, level, icon: LevelIcon, color } = useMemo(() => {
    let deviceId = "";
    if (typeof window !== "undefined") {
      deviceId = getDeviceId();
    }
    
    // Calculate total confirmations for reports submitted by this device
    const myReports = reports.filter(r => r.device_id === deviceId);
    // Base score: 10 per report, plus 50 for every confirmation they received
    const calculatedScore = myReports.reduce((total, r) => {
      return total + 10 + ((r.confidence_score - 1) * 50);
    }, 0);

    if (calculatedScore > 500) return { score: calculatedScore, level: "Community Guardian", icon: Trophy, color: "text-amber-500 bg-amber-50 border-amber-200" };
    if (calculatedScore > 100) return { score: calculatedScore, level: "Reliable Scout", icon: ShieldCheck, color: "text-emerald-500 bg-emerald-50 border-emerald-200" };
    if (calculatedScore > 0) return { score: calculatedScore, level: "Active Reporter", icon: Target, color: "text-blue-500 bg-blue-50 border-blue-200" };
    return { score: 0, level: "Novice", icon: Award, color: "text-slate-400 bg-slate-50 border-slate-200" };
  }, [reports]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Your Reputation</h4>
        <span className="text-xs font-black text-slate-700">{score} XP</span>
      </div>
      <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${color}`}>
        <LevelIcon className="h-5 w-5 shrink-0" />
        <div className="flex flex-col">
          <span className="text-[11px] font-bold leading-tight">{level}</span>
          <span className="text-[9px] font-medium opacity-80 leading-tight">Reports are highly trusted</span>
        </div>
      </div>
    </div>
  );
}
