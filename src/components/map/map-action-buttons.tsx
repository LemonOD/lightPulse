"use client";

import { Compass, Plus } from "lucide-react";

interface MapActionButtonsProps {
  handleDetectLocation: () => void;
  handleOpenReportModal: () => void;
}

export default function MapActionButtons({
  handleDetectLocation,
  handleOpenReportModal,
}: MapActionButtonsProps) {
  return (
    <div className="absolute bottom-[140px] md:bottom-8 right-4 md:right-6 z-10 flex flex-col gap-3 pointer-events-auto">
      {/* Compass/GPS Target button */}
      <button
        onClick={handleDetectLocation}
        className="h-12 w-12 rounded-full bg-white border border-slate-100 text-slate-800 shadow-xl flex items-center justify-center active:scale-95 transition-all transform cursor-pointer"
      >
        <Compass className="h-5 w-5 stroke-[2.25]" />
      </button>

      {/* Green Report Plus Button */}
      <button
        onClick={handleOpenReportModal}
        className="h-12 w-12 rounded-full bg-[#22C55E] hover:bg-emerald-600 text-white shadow-xl flex items-center justify-center active:scale-95 transition-all transform cursor-pointer"
      >
        <Plus className="h-5.5 w-5.5 stroke-[2.5]" />
      </button>
    </div>
  );
}
