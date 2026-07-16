"use client";

import React from "react";
import { Grid, List, Search } from "lucide-react";
import DirectoryGroup from "./directory-group";
import { AreaItem } from "./directory-item";

interface AllAreasDirectoryProps {
  alphabetizedGroups: Record<string, AreaItem[]>;
  selectedAreaId: string | null;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  handleSelectArea: (areaId: string) => void;
  searchQuery: string;
}

export default function AllAreasDirectory({
  alphabetizedGroups,
  selectedAreaId,
  viewMode,
  setViewMode,
  handleSelectArea,
  searchQuery
}: AllAreasDirectoryProps) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium text-slate-900 tracking-tight dark:text-slate-400">
            All Areas
          </h2>
        </div>

        {/* Toggle view options - hidden on mobile viewports */}
        <div className="hidden md:flex items-center border border-slate-100 bg-slate-50/50 p-1 rounded-xl glass-shadow">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "grid" ? "bg-white text-emerald-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "list" ? "bg-white text-emerald-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Directory Alpha Groups */}
      <div className="flex flex-col gap-6">
        {Object.keys(alphabetizedGroups).map((letter) => (
          <DirectoryGroup
            key={letter}
            letter={letter}
            areas={alphabetizedGroups[letter]}
            selectedAreaId={selectedAreaId}
            viewMode={viewMode}
            handleSelectArea={handleSelectArea}
          />
        ))}

        {/* Search Empty State */}
        {Object.keys(alphabetizedGroups).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Search className="h-8 w-8 stroke-[1.5]" />
            <p className="text-xs font-medium tracking-wider">
              No neighborhoods found matching &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
