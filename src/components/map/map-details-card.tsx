"use client";

import { Zap, ZapOff, AlertTriangle, ChevronRight } from "lucide-react";
import { Area, ReportStatus } from "@/lib/types";

interface MapDetailsCardProps {
  activeArea: Area & { status: ReportStatus; timeAgo: string; detailLabel: string } | null;
  handleOpenReportModal: () => void;
}

export default function MapDetailsCard({
  activeArea,
  handleOpenReportModal,
}: MapDetailsCardProps) {
  if (!activeArea) return null;

  return (
    <div
      onClick={handleOpenReportModal}
      className="absolute bottom-20 left-4 right-4 z-10 md:hidden bg-white border border-slate-100 p-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer transition-all duration-300 transform active:scale-98 pointer-events-auto"
    >
      <div className="flex items-center gap-3">
        {/* Colored Indicator Block exactly matching screenshot */}
        <div
          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
            activeArea.status === "LIGHT_AVAILABLE"
              ? "bg-emerald-500 text-white"
              : activeArea.status === "LIGHT_OUT"
              ? "bg-[#b21d23] text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          {activeArea.status === "LIGHT_AVAILABLE" ? (
            <Zap className="h-5.5 w-5.5 fill-white" />
          ) : activeArea.status === "LIGHT_OUT" ? (
            <ZapOff className="h-5.5 w-5.5 stroke-[2.25]" />
          ) : (
            <AlertTriangle className="h-5.5 w-5.5 stroke-[2.25]" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-800 tracking-tight">
            {activeArea.name === "Yaba" ? "Yaba Tech" : activeArea.name}, Lagos
          </span>
          <span className="text-[9px] font-medium text-slate-400 leading-tight">
            {activeArea.timeAgo} • {activeArea.detailLabel}
          </span>
        </div>
      </div>
      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
        <ChevronRight className="h-5 w-5 stroke-[2.5]" />
      </div>
    </div>
  );
}
