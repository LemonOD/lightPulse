"use client";

import React from "react";
import { Compass } from "lucide-react";
import NearYouCard, { NearYouArea } from "./near-you-card";

interface NearYouGridProps {
  nearYouAreas: NearYouArea[];
  selectedAreaId: string | null;
  userLocation: [number, number] | null;
  handleSelectArea: (areaId: string) => void;
}

export default function NearYouGrid({
  nearYouAreas,
  selectedAreaId,
  userLocation,
  handleSelectArea
}: NearYouGridProps) {
  return (
    <section className="mb-10">
      {/* Desktop Heading layout */}
      <div className="hidden md:flex items-center gap-2 mb-5">
        <Compass className="h-5 w-5 text-emerald-500 stroke-[2.25]" />
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 tracking-tight">
          Near Your Current Location
        </h2>
      </div>

      {/* Mobile Heading layout matching screenshot: Near You followed by a green dot */}
      <div className="flex md:hidden items-center gap-1.5 mb-5 mt-2">
        <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100 tracking-tight">
          Near You
        </h2>
        <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E] inline-block mt-2 ml-0.5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {nearYouAreas.map((area) => (
          <NearYouCard
            key={area.id}
            area={area}
            selected={selectedAreaId === area.id}
            userLocation={userLocation}
            onSelect={() => handleSelectArea(area.id)}
          />
        ))}
      </div>
    </section>
  );
}
