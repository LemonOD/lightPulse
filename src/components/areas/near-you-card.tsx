"use client";

import React from "react";
import Image from "next/image";
import { Area, ReportStatus } from "@/lib/types";
import { StatusBadge, StatusIcon } from "./status-indicators";

export interface NearYouArea extends Area {
  status: ReportStatus;
  timeAgo: string;
  confirmations: number;
  reportsCount: number;
  distance?: number;
  customInfo?: string;
  avatars?: string[];
  avatarExtra?: string;
}

interface NearYouCardProps {
  area: NearYouArea;
  selected: boolean;
  userLocation: [number, number] | null;
  onSelect: () => void;
}

export default function NearYouCard({
  area,
  selected,
  userLocation,
  onSelect
}: NearYouCardProps) {
  return (
    <>
      <div
        onClick={onSelect}
        className={`hidden md:flex rounded-xl border p-6 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 flex flex-col justify-between min-h-[140px] ${
          selected
            ? "bg-white border-slate-200 ring-2 ring-emerald-50"
            : "bg-white/70 border-slate-200 hover:border-slate-200"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col text-left">
            <span className="text-base font-bold text-slate-800 tracking-tight">
              {area.name}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              {area.description}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge status={area.status} />
            {userLocation && area.distance !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[8px] font-bold text-blue-500 tracking-widest leading-none">
                {area.distance.toFixed(1)} km away
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-6 border-t border-slate-50 pt-3">
          <div className="flex items-center gap-2">
            {area.avatars && area.avatars.length > 0 ? (
              <div className="flex -space-x-1.5 overflow-hidden">
                {area.avatars.map((av, idx) => (
                  <div key={idx} className="relative h-5 w-5 rounded-full ring-2 ring-white overflow-hidden">
                    <Image src={av} fill sizes="20px" alt="Active user avatar" className="object-cover" />
                  </div>
                ))}
                {area.avatarExtra && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-extrabold text-slate-500 ring-2 ring-white">
                    {area.avatarExtra}
                  </span>
                )}
              </div>
            ) : area.customInfo ? (
              <span className={`text-[10px] font-extrabold tracking-wide ${area.status === "LIGHT_OUT" ? "text-red-500" : "text-amber-500"}`}>
                {area.customInfo}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400">No events</span>
            )}

            {area.confirmations > 0 && (
              <span className="text-[9px] font-bold text-slate-400">
                {area.confirmations} confirms
              </span>
            )}
          </div>

          <span className="text-[9px] font-bold text-slate-400">
            {area.timeAgo}
          </span>
        </div>
      </div>

      <div
        onClick={onSelect}
        className={`md:hidden rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-98 ${
          selected ? "ring-2 ring-emerald-50 border-emerald-200" : ""
        }`}
      >
        <div className="flex flex-col gap-1.5 text-left">
          <span className="text-base font-bold text-slate-800 tracking-tight leading-none">
            {area.name}
          </span>
          <span className={`text-[10px] font-bold tracking-wider leading-none ${
            area.status === "LIGHT_AVAILABLE" ? "text-emerald-600" :
            area.status === "LIGHT_OUT" ? "text-red-600" :
            "text-amber-500"
          }`}>
            STATUS: {
              area.status === "LIGHT_AVAILABLE" ? "ONLINE" :
              area.status === "LIGHT_OUT" ? "OUTAGE" :
              "FLUCTUATING"
            }
          </span>
        </div>
        
        <StatusIcon status={area.status} />
      </div>
    </>
  );
}
