"use client";

import { Zap, ZapOff, AlertTriangle, X } from "lucide-react";
import { Area, ReportStatus } from "@/lib/mockData";

interface ReportStatusModalProps {
  showReportModal: boolean;
  setShowReportModal: (val: boolean) => void;
  activeArea: (Area & { status: ReportStatus }) | null;
  reportStatus: "stable" | "outage" | "unstable" | "unknown" | null;
  setReportStatus: (status: "stable" | "outage" | "unstable") => void;
  comment: string;
  setComment: (val: string) => void;
  isSubmitting: boolean;
  handleReportSubmit: (e: React.FormEvent) => void;
}

const MODAL_STATUS_BUTTONS = [
  {
    id: "stable" as const,
    name: "Stable",
    icon: Zap,
    activeColor: "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100",
    hoverColor: "hover:bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    id: "outage" as const,
    name: "Outage",
    icon: ZapOff,
    activeColor: "bg-red-500 text-white border-red-500 shadow-md shadow-red-100",
    hoverColor: "hover:bg-red-50 text-red-600 border-red-100",
  },
  {
    id: "unstable" as const,
    name: "Unstable",
    icon: AlertTriangle,
    activeColor: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100",
    hoverColor: "hover:bg-amber-50 text-amber-600 border-amber-100",
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
}: ReportStatusModalProps) {
  if (!showReportModal || !activeArea) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop blur */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => setShowReportModal(false)}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl z-50 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setShowReportModal(false)}
          className="absolute right-5 top-5 p-1.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 w-fit">
            New Power Report
          </span>
          <h3 className="text-xl font-extrabold text-slate-800 mt-2">
            Report for {activeArea.name}
          </h3>
        </div>

        <form onSubmit={handleReportSubmit} className="flex flex-col gap-5">
          {/* Status Select Grid */}
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
                        : `bg-white border-slate-200 text-slate-600 ${s.hoverColor}`
                    }`}
                  >
                    <SIcon className="h-4 w-4" />
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment text area */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Add Details
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Power restored just now. Very stable phase..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300 text-xs font-semibold text-slate-700 leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !reportStatus}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 mt-2 cursor-pointer"
          >
            <span>Submit Report</span>
          </button>
        </form>
      </div>
    </div>
  );
}
