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
      ? `h-12 px-4 rounded-xl border font-bold text-xs text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:-translate-y-0.5 ${
          selected ? "ring-2 ring-emerald-100 dark:ring-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-900" : ""
        }`
      : `py-2.5 px-4 rounded-xl border text-xs font-medium text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 ${
          selected ? "ring-2 ring-emerald-100 dark:ring-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-900" : ""
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
      className={`w-full py-4 px-4.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-left transition-all duration-200 active:scale-99 shadow-sm cursor-pointer ${
        selected ? "ring-2 ring-emerald-50 dark:ring-emerald-500/20 border-emerald-200 dark:border-emerald-500/30" : ""
      }`}
    >
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{area.name}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-slate-500 dark:text-slate-400"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}
