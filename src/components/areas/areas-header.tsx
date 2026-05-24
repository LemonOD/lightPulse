"use client";

import { Compass, Search } from "lucide-react";

interface AreasHeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  handleDetectLocation: () => void;
  isLocating: boolean;
}

export default function AreasHeader({
  searchQuery,
  onSearchChange,
  handleDetectLocation,
  isLocating
}: AreasHeaderProps) {
  return (
    <>
      {/* Title Header Grid - Hidden on Mobile viewports */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
            Neighborhood Directory
          </h1>
          <p className="text-sm font-medium text-slate-500 leading-relaxed mt-2 max-w-xl">
            Browse the real-time power status of all residential and commercial districts across Lagos.
          </p>
        </div>

        {/* Detect Location Button - Desktop/Tablet */}
        <button
          onClick={handleDetectLocation}
          disabled={isLocating}
          className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-medium text-xs tracking-wider border transition-all duration-300 transform active:scale-95 ${
            isLocating
              ? "bg-emerald-100 text-emerald-600 border-emerald-200 cursor-default"
              : "text-[#109541] border-[#109541] hover:bg-emerald-50 cursor-pointer"
          }`}
        >
          <Compass className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
          {isLocating ? "Locating GPS..." : "Detect My Location"}
        </button>
      </div>

      {/* Large Input Search Box */}
      <div className="relative mb-8 group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search neighborhoods..."
          className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-slate-200 focus:ring-1 focus:ring-slate-200 text-sm font-medium transition-all"
        />
      </div>
    </>
  );
}
