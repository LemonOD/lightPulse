"use client";

import { Search, Plus } from "lucide-react";
import { Area, ReportStatus } from "@/lib/mockData";

interface MapSidebarProps {
  mapSearch: string;
  setMapSearch: (val: string) => void;
  filteredMapAreas: (Area & { status: ReportStatus; timeAgo: string; detailLabel: string })[];
  selectedAreaId: string | null;
  handleSelectArea: (areaId: string) => void;
  handleOpenReportModal: () => void;
  activeArea: (Area & { status: ReportStatus }) | null;
  getBadgeColor: (status: string) => string;
}

export default function MapSidebar({
  mapSearch,
  setMapSearch,
  filteredMapAreas,
  selectedAreaId,
  handleSelectArea,
  handleOpenReportModal,
  activeArea,
  getBadgeColor,
}: MapSidebarProps) {
  return (
    <div className="hidden md:flex w-full md:w-96 shrink-0 flex-col bg-white/70 backdrop-blur-md border border-slate-100 p-5 rounded-3xl glass-shadow md:h-full md:overflow-hidden">
      {/* Search Header Input */}
      <div className="relative mb-5 group">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
        <input
          type="text"
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          placeholder="Search area (e.g. Yaba)..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-100 bg-white placeholder-slate-400 focus:outline-none focus:border-slate-200 focus:ring-1 focus:ring-slate-200 text-xs font-semibold tracking-wide"
        />
      </div>

      {/* Scrollable list of neighborhood statuses */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 pb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-1 mb-1">
          Nearby Status
        </span>

        {filteredMapAreas.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelectArea(item.id)}
            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 transform active:scale-99 flex flex-col gap-2 ${
              selectedAreaId === item.id
                ? "bg-white border-emerald-200 ring-2 ring-emerald-50 shadow-md"
                : "bg-white/50 border-slate-100 hover:border-slate-200 hover:bg-white/80"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-extrabold text-slate-800 tracking-tight">
                {item.name === "Yaba" ? "Yaba Tech" : item.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${getBadgeColor(
                  item.status
                )}`}
              >
                {item.status === "stable"
                  ? "STABLE"
                  : item.status === "outage"
                  ? "OUTAGE"
                  : item.status === "unstable"
                  ? "UNSTABLE"
                  : "UNKNOWN"}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400">{item.timeAgo}</span>
              <span
                className={`text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                  item.status === "stable"
                    ? "text-emerald-500"
                    : item.status === "outage"
                    ? "text-red-500"
                    : item.status === "unstable"
                    ? "text-amber-500"
                    : "text-slate-400"
                }`}
              >
                <span className="h-1 w-1 rounded-full bg-current" />
                {item.detailLabel}
              </span>
            </div>
          </div>
        ))}

        {filteredMapAreas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-[10px] font-bold uppercase tracking-wider gap-2">
            <Search className="h-6 w-6 text-slate-300" />
            <span>No areas match search</span>
          </div>
        )}
      </div>

      {/* Action Button: "+ Report Status" */}
      {activeArea && (
        <button
          onClick={handleOpenReportModal}
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-100 transition-all flex items-center justify-center gap-2 mt-4 active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Report Status
        </button>
      )}
    </div>
  );
}
