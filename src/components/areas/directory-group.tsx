"use client";

import React from "react";
import DirectoryItem, { AreaItem } from "./directory-item";

interface DirectoryGroupProps {
  letter: string;
  areas: AreaItem[];
  selectedAreaId: string | null;
  viewMode: "grid" | "list";
  handleSelectArea: (areaId: string) => void;
}

export default function DirectoryGroup({
  letter,
  areas,
  selectedAreaId,
  viewMode,
  handleSelectArea
}: DirectoryGroupProps) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-8 border-b border-slate-100/50 pb-6 last:border-0 last:pb-0 dark:border-slate-900">
      {/* Alpha Indicator Anchor - Desktop */}
      <div className="hidden md:flex w-8 h-8 rounded-xl bg-slate-100 items-center justify-center shrink-0 dark:bg-black dark:border dark:border-slate-700">
        <span className="text-lg text-slate-400 leading-none">
          {letter}
        </span>
      </div>

      {/* Alpha Indicator Anchor - Mobile viewports matching mockup */}
      <div className="md:hidden flex shrink-0 mt-3 mb-1">
        <span className="text-lg font-medium text-[#0A5C36] leading-none uppercase">
          {letter}
        </span>
      </div>

      {/* Desktop Area Listings */}
      <div className="hidden md:block flex-1">
        <div className={
          viewMode === "grid"
            ? "grid grid-cols-2 sm:grid-cols-4 gap-3.5"
            : "flex flex-col gap-2"
        }>
          {areas.map((area) => (
            <DirectoryItem
              key={area.id}
              area={area}
              selected={selectedAreaId === area.id}
              viewMode={viewMode}
              onSelect={() => handleSelectArea(area.id)}
              device="desktop"
            />
          ))}
        </div>
      </div>

      {/* Mobile Area Listings matching screenshot (hidden on desktop) */}
      <div className="md:hidden flex-1 flex flex-col gap-2.5 w-full">
        {areas.map((area) => (
          <DirectoryItem
            key={area.id}
            area={area}
            selected={selectedAreaId === area.id}
            onSelect={() => handleSelectArea(area.id)}
            device="mobile"
          />
        ))}
      </div>
    </div>
  );
}
