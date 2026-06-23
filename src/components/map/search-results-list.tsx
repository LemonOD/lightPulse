"use client";

import { Area, ReportStatus } from "@/lib/types";

interface SearchResultsListProps {
  mapSearch: string;
  setMapSearch: (val: string) => void;
  filteredMapAreas: (Area & { status: ReportStatus })[];
  handleSelectArea: (areaId: string) => void;
  getBadgeColor: (status: string) => string;
}

export default function SearchResultsList({
  mapSearch,
  setMapSearch,
  filteredMapAreas,
  handleSelectArea,
  getBadgeColor,
}: SearchResultsListProps) {
  if (mapSearch.trim() === "") return null;

  return (
    <div className="absolute top-20 left-4 right-4 z-20 md:hidden bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 flex flex-col gap-1 pointer-events-auto">
      {filteredMapAreas.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            handleSelectArea(item.id);
            setMapSearch(""); // Clear search to dismiss results
          }}
          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 rounded-xl border border-transparent hover:border-slate-100 cursor-pointer"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-slate-800 tracking-tight truncate">
              {item.name}
            </span>
            <span className="text-[9px] font-bold text-slate-400 truncate">
              {item.description}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${getBadgeColor(
                item.status
              )}`}
            >
              {item.status === "LIGHT_AVAILABLE"
                ? "STABLE"
                : item.status === "LIGHT_OUT"
                ? "OUTAGE"
                : item.status === "LOW_VOLTAGE"
                ? "UNSTABLE"
                : "UNKNOWN"}
            </span>
          </div>
        </button>
      ))}
      {filteredMapAreas.length === 0 && (
        <div className="py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          No matching areas
        </div>
      )}
    </div>
  );
}
