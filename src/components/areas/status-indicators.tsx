"use client";

import React from "react";

// Types matching lib schemas
export type AreaStatus = "stable" | "outage" | "unstable" | string;

interface StatusComponentProps {
  status: AreaStatus;
  className?: string;
}

// 1. StatusBadge (desktop layout pills)
export function StatusBadge({ status, className = "" }: StatusComponentProps) {
  let colorClass = "text-slate-500 bg-slate-50 border-slate-100/50";
  let label = "UNKNOWN";

  if (status === "stable") {
    colorClass = "text-emerald-500 bg-emerald-50 border-emerald-100/50";
    label = "ONLINE";
  } else if (status === "outage") {
    colorClass = "text-red-500 bg-red-50 border-red-100/50";
    label = "OUTAGE";
  } else if (status === "unstable") {
    colorClass = "text-amber-500 bg-amber-50 border-amber-100/50";
    label = "FLUCTUATING";
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-lg border text-[9px] font-bold tracking-wider ${colorClass} ${className}`}>
      {label}
    </span>
  );
}

// 2. StatusDot (simple bullet indicator for alphabetical grid list)
export function StatusDot({ status, className = "" }: StatusComponentProps) {
  let colorClass = "bg-slate-300";

  if (status === "stable") {
    colorClass = "bg-emerald-500";
  } else if (status === "outage") {
    colorClass = "bg-red-500";
  } else if (status === "unstable") {
    colorClass = "bg-amber-500";
  }

  return (
    <span className={`h-2 w-2 rounded-full ${colorClass} shrink-0 ${className}`} />
  );
}

// 3. StatusIcon (mobile circular status indicators)
export function StatusIcon({ status, className = "" }: StatusComponentProps) {
  let containerBg = "bg-slate-100 text-slate-400";
  
  if (status === "stable") {
    containerBg = "bg-[#22C55E] text-white";
  } else if (status === "outage") {
    containerBg = "bg-[#ef4444] text-white";
  } else if (status === "unstable") {
    containerBg = "bg-[#FEF3C7] text-[#f59e0b] border border-[#FEF3C7]/80";
  }

  return (
    <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform ${containerBg} ${className}`}>
      {status === "stable" ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5.5 w-5.5 fill-white text-[#22C55E]">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
          <path d="M9 18h6"/>
          <path d="M10 22h4"/>
        </svg>
      ) : status === "outage" ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5.5 w-5.5 text-white">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
          <path d="M9 18h6"/>
          <path d="M10 22h4"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : status === "unstable" ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5 text-[#f59e0b]">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      )}
    </div>
  );
}
