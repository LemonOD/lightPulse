"use client";

import { Search, SlidersHorizontal } from "lucide-react";

interface MobileSearchBarProps {
  mapSearch: string;
  setMapSearch: (val: string) => void;
  showLegendMobile: boolean;
  setShowLegendMobile: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MobileSearchBar({
  mapSearch,
  setMapSearch,
  showLegendMobile,
  setShowLegendMobile,
}: MobileSearchBarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 md:hidden bg-white border border-slate-100 rounded-2xl shadow-lg h-14 flex items-center justify-between px-4 pointer-events-auto">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          placeholder="Search area (e.g. Yaba)"
          className="w-full focus:outline-none placeholder-slate-400 text-xs font-semibold text-slate-800 leading-none bg-transparent"
        />
      </div>
      <button
        onClick={() => setShowLegendMobile((prev) => !prev)}
        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
          showLegendMobile
            ? "bg-emerald-500 text-white"
            : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        }`}
      >
        <SlidersHorizontal className="h-4.5 w-4.5 stroke-[2.25]" />
      </button>
    </div>
  );
}
