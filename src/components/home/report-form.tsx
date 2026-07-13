"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { submitReport } from "@/store/slices/dataSlice";
import { Zap, ZapOff, AlertTriangle, Loader2, LucideIcon } from "lucide-react";
import { ReportStatus } from "@/lib/types";
import { toast } from "react-hot-toast";
import ReportStatusModal from "@/components/map/report-status-modal";

const BASE_BUTTON_CLASS =
  "flex flex-col items-center justify-center gap-2.5 py-4.5 rounded-2xl font-extrabold text-[11px] tracking-wide text-white transition-all duration-300 transform active:scale-95 shadow-sm cursor-pointer disabled:opacity-75";

interface StatusButtonConfig {
  status: ReportStatus;
  label: string;
  icon: LucideIcon;
  bgClass: string;
  iconClass?: string;
}

const REPORT_STATUS_CONFIG: StatusButtonConfig[] = [
  {
    status: "LIGHT_OUT",
    label: "Light Out",
    icon: ZapOff,
    bgClass: "bg-[#b21d23] hover:bg-red-800",
  },
  {
    status: "LIGHT_AVAILABLE",
    label: "Light Restored",
    icon: Zap,
    bgClass: "bg-[#22c55e] hover:bg-emerald-600",
    iconClass: "fill-white",
  },
  {
    status: "LOW_VOLTAGE",
    label: "Low Voltage",
    icon: AlertTriangle,
    bgClass: "bg-[#f59e0b] hover:bg-amber-600",
  },
];

export default function ReportForm() {
  const dispatch = useAppDispatch();
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const areas = useAppSelector((state) => state.data.areas);
  const userLocation = useAppSelector((state) => state.app.userLocation);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState<ReportStatus | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [modalStatus, setModalStatus] = useState<ReportStatus | null>(null);
  const [comment, setComment] = useState("");

  const activeArea = areas.find(a => a.id === selectedAreaId) || { name: "Detecting location...", id: "" };

  const getDefaultComment = (status: ReportStatus): string => {
    if (status === "LIGHT_AVAILABLE") return "Light is up!";
    if (status === "LIGHT_OUT") return "Blackout reported.";
    if (status === "LOW_VOLTAGE") return "Voltage fluctuations detected.";
    return "Status update submitted.";
  };

  const handleStatusSelect = async (status: ReportStatus) => {
    if (!activeArea.id || isSubmitting) return;

    if (activeArea.name === "My Current Location") {
      setModalStatus(status);
      setComment(getDefaultComment(status));
      setShowReportModal(true);
      return;
    }

    await submitReportDirectly(status, activeArea.name);
  };

  const submitReportDirectly = async (status: ReportStatus, areaName: string) => {
    setIsSubmitting(true);
    setSubmittingStatus(status);
    try {
      const report = await dispatch(
        submitReport({
          area_id: activeArea.id,
          area_name: activeArea.name,
          status: status,
          comment: getDefaultComment(status),
          ...(userLocation ? { latitude: userLocation[0], longitude: userLocation[1] } : {}),
        })
      ).unwrap();

      if (report.area_id !== activeArea.id) {
        dispatch({ type: "app/setSelectedAreaId", payload: report.area_id });
        toast.success(`Report merged with a nearby community!`, {
          icon: "🔗",
        });
      } else {
        toast.success(`Power status updated! Thank you for updating ${areaName}.`, {
          icon: "⚡",
        });
      }
    } catch (err) {
      console.error("Failed to submit report:", err);
      toast.error("Failed to register power status. Please try again.");
    } finally {
      setIsSubmitting(false);
      setSubmittingStatus(null);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent, customName?: string) => {
    e.preventDefault();
    if (!activeArea.id || isSubmitting || !modalStatus) return;
    
    setShowReportModal(false);
    await submitReportDirectly(modalStatus, customName || activeArea.name);
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-slate-800 tracking-tight">
        What&apos;s the status now?
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {REPORT_STATUS_CONFIG.map(({ status, label, icon: Icon, bgClass, iconClass }) => {
          const isThisSubmitting = isSubmitting && submittingStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusSelect(status)}
              disabled={isSubmitting}
              className={`${BASE_BUTTON_CLASS} ${bgClass}`}
            >
              {isThisSubmitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Icon className={`h-6 w-6 stroke-[2.25] ${iconClass || ""}`} />
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <ReportStatusModal
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        activeArea={activeArea as any}
        reportStatus={modalStatus}
        setReportStatus={setModalStatus as any}
        comment={comment}
        setComment={setComment}
        isSubmitting={isSubmitting}
        handleReportSubmit={handleModalSubmit}
        userLocation={userLocation}
      />
    </div>
  );
}
