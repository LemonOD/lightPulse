"use client";

import Link from "next/link";
import { Map, Zap } from "lucide-react";

export default function MapPreview() {
  return (
    <>
      {/* MOBILE MAP PREVIEW (Clean dark grid teaser card exactly as user configured) */}
      <Link
        href="/map"
        className="flex md:hidden relative h-32 w-full rounded-2xl overflow-hidden items-center justify-center group border-0 shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer"
      >
        <svg className="absolute inset-0 h-full w-full stroke-slate-800/40 fill-none stroke-2" viewBox="0 0 320 128">
          <path d="M-10 64 C90 64 130 24 210 44 C290 64 230 114 330 84" />
          <path d="M110 0 C130 44 90 84 160 128" />
          <path d="M40 0 C70 50 180 50 200 128" />
          <path d="M0 100 C150 100 150 20 320 20" />
          
          <circle cx="130" cy="44" r="3" className="fill-emerald-400 stroke-emerald-950 stroke-1 animate-pulse" />
          <circle cx="220" cy="49" r="3" className="fill-red-500 stroke-red-950 stroke-1" />
          <circle cx="165" cy="85" r="3" className="fill-amber-500 stroke-amber-950 stroke-1" />
        </svg>

        <div className="absolute flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-105 z-10 select-none">
          <Map className="h-4 w-4 text-emerald-500 stroke-[2.25]" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
            Explore Local Grid
          </span>
        </div>
      </Link>

      {/* DESKTOP MAP PREVIEW (Beautiful two-part Lagos vector map card with status table, exactly matching screenshot) */}
      <div className="hidden md:flex flex-col w-full rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        
        {/* Top Half: Light Stylized Lagos Map Backdrop */}
        <Link
          href="/map"
          className="relative h-44 w-full bg-[#e8f1f7] overflow-hidden flex items-end p-5 group cursor-pointer border-b border-slate-100"
        >
          {/* Stylized vector map graphics */}
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-103">
            
            {/* Water Lagoons / Oceans */}
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 320 176">
              <path d="M 0 140 Q 120 120 180 150 T 320 110 L 320 176 L 0 176 Z" fill="#cbe2f4" />
              <path d="M 220 0 Q 250 40 320 30 L 320 0 Z" fill="#cbe2f4" />
            </svg>

            {/* Road networks */}
            <svg className="absolute inset-0 h-full w-full stroke-white/80 fill-none stroke-[2.5]" viewBox="0 0 320 176">
              <path d="M-10 70 C80 70 120 30 200 50 C280 70 240 120 330 90" />
              <path d="M120 0 C140 50 100 90 170 176" />
              <path d="M40 0 C70 60 190 60 210 176" />
              <path d="M0 110 C160 110 160 30 320 30" />
            </svg>

            {/* Secondary minor roads */}
            <svg className="absolute inset-0 h-full w-full stroke-slate-200/50 fill-none stroke-[1.2]" viewBox="0 0 320 176">
              <path d="M 30 0 L 30 176" />
              <path d="M 260 0 L 260 176" />
              <path d="M 0 50 L 320 50" />
              <path d="M 0 130 L 320 130" />
            </svg>

            {/* Dynamic Status indicators pins */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full text-[10px] font-bold">
              {/* Ojodu Berger */}
              <div className="absolute top-4 right-14 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 border border-white" />
                <span className="text-[7px] text-slate-400 font-extrabold uppercase">Ojodu Berger</span>
              </div>
              
              {/* Agege */}
              <div className="absolute top-10 left-6 flex flex-col items-start leading-none">
                <span className="text-slate-800 font-extrabold text-[11px] tracking-tight">Agege</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 border border-white mt-1" />
              </div>

              {/* Ikeja Grid center */}
              <div className="absolute top-14 right-20 flex flex-col items-center">
                <span className="text-slate-800 font-black text-xs tracking-tight leading-none">Ikeja</span>
                <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-0.5">Lagos</span>
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center text-white mt-1 animate-pulse">
                  <Zap className="h-2 w-2 fill-white stroke-[2.5]" />
                </span>
              </div>

              {/* Maryland */}
              <div className="absolute bottom-10 right-8 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500 border border-white" />
                <span className="text-[7px] text-slate-400 font-extrabold uppercase">Maryland</span>
              </div>
            </div>

          </div>

          {/* Overlay Hover glass layer */}
          <div className="absolute inset-0 bg-slate-900/10 transition-colors duration-300 group-hover:bg-slate-900/0" />

          {/* Overlay Text Details matching mockup */}
          <div className="absolute bottom-4 left-5 z-10 flex flex-col gap-0.5 text-left">
            <span className="text-sm font-extrabold text-white tracking-tight leading-none drop-shadow-sm">
              Neighborhood View
            </span>
            <span className="text-[10px] font-bold text-slate-200 tracking-wide drop-shadow-sm">
              Tap to expand full map
            </span>
          </div>

        </Link>

        {/* Bottom Half: Status List table matching mockup perfectly */}
        <div className="p-5 flex flex-col gap-3.5 bg-white">
          
          {/* Yaba Row */}
          <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
            <span className="text-xs font-extrabold text-slate-700 tracking-tight">
              Yaba
            </span>
            <span className="px-2 py-0.5 rounded-lg border border-emerald-100/50 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider">
              STABLE
            </span>
          </div>

          {/* Surulere Row */}
          <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
            <span className="text-xs font-extrabold text-slate-700 tracking-tight">
              Surulere
            </span>
            <span className="px-2 py-0.5 rounded-lg border border-red-100/50 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider">
              OUTAGE
            </span>
          </div>

          {/* Ikeja Row */}
          <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
            <span className="text-xs font-extrabold text-slate-700 tracking-tight">
              Ikeja
            </span>
            <span className="px-2 py-0.5 rounded-lg border border-amber-100/50 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-wider">
              UNSTABLE
            </span>
          </div>

        </div>

      </div>
    </>
  );
}
