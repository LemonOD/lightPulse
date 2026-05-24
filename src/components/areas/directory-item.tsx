"use client";

import React from "react";
import { StatusDot } from "./status-indicators";

export interface AreaItem {
  id: string;
  name: string;
  status: string;
}

interface DirectoryItemProps {
  area: AreaItem;
  selected: boolean;
  viewMode?: "grid" | "list";
  onSelect: () => void;
  device: "desktop" | "mobile";
}

export default function DirectoryItem({
  area,
  selected,
  viewMode = "grid",
  onSelect,
  device
}: DirectoryItemProps) {
  if (device === "desktop") {
    const layoutClasses = viewMode === "grid"
      ? `h-12 px-4 rounded-xl border font-bold text-xs text-slate-700 bg-white/70 hover:bg-white border-slate-100 hover:border-slate-200 hover:-translate-y-0.5 ${
          selected ? "ring-2 ring-emerald-100 border-emerald-200 bg-white" : ""
        }`
      : `py-2.5 px-4 rounded-xl border text-xs font-medium text-slate-700 bg-white/70 hover:bg-white border-slate-100 hover:border-slate-200 ${
          selected ? "ring-2 ring-emerald-100 border-emerald-200 bg-white" : ""
        }`;

    return (
      <button
        onClick={onSelect}
        className={`flex items-center justify-between text-left transition-all duration-200 transform active:scale-98 glass-shadow cursor-pointer ${layoutClasses}`}
      >
        <span className="truncate pr-2">{area.name}</span>
        <StatusDot status={area.status} />
      </button>
    );
  }

  // Mobile View Button Card with row chevrons (>)
  return (
    <button
      onClick={onSelect}
      className={`w-full py-4 px-4.5 rounded-xl border border-slate-150 bg-white flex items-center justify-between text-left transition-all duration-200 active:scale-99 shadow-sm cursor-pointer ${
        selected ? "ring-2 ring-emerald-50 border-emerald-200" : ""
      }`}
    >
      <span className="text-sm font-medium text-slate-800">{area.name}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-slate-500"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}
