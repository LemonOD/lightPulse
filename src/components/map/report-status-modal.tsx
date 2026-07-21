"use client";

import { Zap, ZapOff, AlertTriangle, X, Loader2 } from "lucide-react";
import { Area, ReportStatus } from "@/lib/types";
import { getHaversineDistance } from "@/lib/geolocation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch } from "@/store";

interface ReportStatusModalProps {
  showReportModal: boolean;
  setShowReportModal: (val: boolean) => void;
  activeArea: (Area & { status: ReportStatus }) | null;
  reportStatus: "LIGHT_AVAILABLE" | "LIGHT_OUT" | "LOW_VOLTAGE" | "UNKNOWN" | null;
  setReportStatus: (status: "LIGHT_AVAILABLE" | "LIGHT_OUT" | "LOW_VOLTAGE") => void;
  comment: string;
  setComment: (val: string) => void;
  isSubmitting: boolean;
  handleReportSubmit: (e: React.FormEvent, customName?: string) => void;
  userLocation?: [number, number] | null;
}

const MODAL_STATUS_BUTTONS = [
  {
    id: "LIGHT_AVAILABLE" as const,
    name: "Light Restored",
    icon: Zap,
    activeColor: "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100 dark:shadow-none",
    hoverColor: "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/30",
  },
  {
    id: "LIGHT_OUT" as const,
    name: "Light Out",
    icon: ZapOff,
    activeColor: "bg-red-500 text-white border-red-500 shadow-md shadow-red-100 dark:shadow-none",
    hoverColor: "hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-500 border-red-100 dark:border-red-500/30",
  },
  {
    id: "LOW_VOLTAGE" as const,
    name: "Low Voltage",
    icon: AlertTriangle,
    activeColor: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100 dark:shadow-none",
    hoverColor: "hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-500/30",
  },
] as const;

export default function ReportStatusModal({
  showReportModal,
  setShowReportModal,
  activeArea,
  reportStatus,
  setReportStatus,
  comment,
  setComment,
  isSubmitting,
  handleReportSubmit,
  userLocation,
}: ReportStatusModalProps) {
  const dispatch = useAppDispatch();
  const [customAreaName, setCustomAreaName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (activeArea?.id?.startsWith("custom-loc-gps") || activeArea?.name === "My Current Location" || activeArea?.id === "") {
      setCustomAreaName(activeArea.name !== "My Current Location" && activeArea.name !== "Detecting location..." ? activeArea.name : "");
    }
  }, [activeArea]);

  if (!showReportModal || !activeArea || !mounted) return null;

  const hasCoords = activeArea.lat !== undefined && activeArea.lng !== undefined;
  const distance = userLocation && hasCoords ? getHaversineDistance(userLocation[0], userLocation[1], activeArea.lat, activeArea.lng) : null;
  const isTooFar = distance !== null && distance > 4;

  const isManualSetup = activeArea.id === "" || activeArea.name === "Detecting location...";

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => setShowReportModal(false)}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl z-50 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setShowReportModal(false)}
          className="absolute right-5 top-5 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 w-fit">
            New Power Report
          </span>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">
            {isManualSetup ? "Specify Your Location" : `Report for ${activeArea.name}`}
          </h3>
        </div>

        <form onSubmit={(e) => handleReportSubmit(e, (activeArea.id?.startsWith("custom-loc-gps") || activeArea.name === "My Current Location" || isManualSetup) ? customAreaName : undefined)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Select Status
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {MODAL_STATUS_BUTTONS.map((s) => {
                const SIcon = s.icon;
                const isActive = reportStatus === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setReportStatus(s.id)}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl border text-[10px] font-bold gap-1.5 transition-all duration-200 transform active:scale-95 cursor-pointer ${
                      isActive
                         ? s.activeColor
                         : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 ${s.hoverColor}`
                    }`}
                  >
                    <SIcon className="h-4 w-4" />
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {(activeArea.id?.startsWith("custom-loc-gps") || activeArea.name === "My Current Location" || isManualSetup) && (
            <div className="flex flex-col gap-2 mb-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Location Name {isManualSetup && "(Required)"}
              </label>
              <input
                type="text"
                required={isManualSetup}
                value={customAreaName}
                onChange={(e) => {
                  setCustomAreaName(e.target.value);
                }}
                placeholder="e.g. Yaba, Lagos"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-300 dark:focus:border-slate-600 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Add Details
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Power restored just now. Very stable phase..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-300 dark:focus:border-slate-600 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed"
            />
          </div>

          {isTooFar ? (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              You are too far from this area to submit a status report.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !reportStatus || isTooFar}
            className="w-full h-12 bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 mt-2 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isSubmitting ? "Submitting..." : "Submit Report"}</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
