"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { confirmReportThunk } from "@/store/slices/dataSlice";
import { Check, MessageSquare, RotateCw, Zap, ZapOff, AlertTriangle, HelpCircle, ThumbsUp } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { getClientUserId } from "@/lib/db";
import { toast } from "react-hot-toast";
import { getHaversineDistance } from "@/lib/geolocation";

export default function ActivityFeed() {
  const dispatch = useAppDispatch();
  const reports = useAppSelector((state) => state.data.reports);
  const selectedAreaId = useAppSelector((state) => state.app.selectedAreaId);
  const areas = useAppSelector((state) => state.data.areas);
  const userLocation = useAppSelector((state) => state.app.userLocation);

  const [visibleCount, setVisibleCount] = useState(3);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    setCurrentUserId(getClientUserId());
  }, []);

  const activeArea = areas.find(a => a.id === selectedAreaId) || areas[0] || { name: "Yaba" };

  // Filter reports nearby or for the selected area first, then others, to match "Recent Reports"
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reports]);

  const handleConfirm = (reportId: string, e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(confirmReportThunk(reportId));
    toast.success("Power status report verified!", {
      icon: "✅",
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const getRelativeTime = (isoString: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins < 1) return "2 mins ago"; // Mock default timing if instant
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  };

  const getReportTitle = (status: string, areaName: string) => {
    const cleanArea = areaName === "Yaba Central" ? "Yaba" : areaName;
    if (status === "stable") return `Light restored in ${cleanArea}`;
    if (status === "outage") return `Power outage reported in ${cleanArea}`;
    if (status === "unstable") return `Low voltage reported in ${cleanArea}`;
    return `Power status updated in ${cleanArea}`;
  };

  const getStatusIconSettings = (status: string) => {
    if (status === "stable") {
      return {
        bgClass: "bg-emerald-50 text-emerald-500 border border-emerald-100/30",
        icon: Zap,
      };
    }
    if (status === "outage") {
      return {
        bgClass: "bg-red-50 text-red-500 border border-red-100/30",
        icon: ZapOff,
      };
    }
    if (status === "unstable") {
      return {
        bgClass: "bg-amber-50 text-amber-500 border border-amber-100/30",
        icon: AlertTriangle,
      };
    }
    return {
      bgClass: "bg-slate-50 text-slate-500 border border-slate-100/30",
      icon: HelpCircle,
    };
  };

  return (
    <div className="flex flex-col gap-4 bg-transparent p-0">

      {/* Feed Header matching mobile screenshot */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm text-slate-800 tracking-tight">
          Activity nearby
        </h4>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="p-1 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RotateCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex flex-col gap-3">
        {sortedReports.slice(0, visibleCount).map((report) => {
          const iconSettings = getStatusIconSettings(report.status);
          const StatusIcon = iconSettings.icon;
          const isAuthor = report.user_id === currentUserId;
          
          const reportArea = areas.find((a) => a.id === report.area_id);
          const distance = userLocation && reportArea 
            ? getHaversineDistance(userLocation[0], userLocation[1], reportArea.lat, reportArea.lng) 
            : null;
          const isTooFar = distance !== null && distance > 3;

          return (
            <div
              key={report.id}
              className="flex items-center justify-between gap-4 p-4 rounded-md border border-slate-200 bg-white"
            >
              {/* Left Side Group */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Left Slightly Rounded Icon Box */}
                <div className={`shrink-0 h-11 w-11 rounded-full flex items-center justify-center ${iconSettings.bgClass}`}>
                  <StatusIcon className="h-5.5 w-5.5 stroke-[2.25] fill-current" />
                </div>

                {/* Central Text Metrics */}
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-semibold text-slate-800 tracking-tight leading-tight">
                    {getReportTitle(report.status, report.area_name)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {getRelativeTime(report.created_at)}
                  </span>

                  {/* Tag Badge */}
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider ${report.status === "stable" ? "bg-emerald-50 text-emerald-600" :
                        report.status === "outage" ? "bg-red-50 text-red-600" :
                          "bg-amber-50 text-amber-600"
                      }`}>
                      {report.confirmations_count} {report.confirmations_count > 1 ? "confirms" : "confirm"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Thumbs-Up Confirm outline button */}
              <button
                onClick={(e) => handleConfirm(report.id, e)}
                disabled={report.has_confirmed || isAuthor || isTooFar}
                title={isTooFar ? "Too far (Must be within 3km)" : undefined}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all duration-200 ${
                  isAuthor || isTooFar
                    ? "bg-slate-50 text-slate-400 border-slate-200 cursor-default"
                    : report.has_confirmed
                    ? "bg-emerald-500 text-white border-emerald-500 cursor-default"
                    : "bg-white text-slate-600 border-slate-200 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
                }`}
              >
                {isAuthor ? (
                  <>
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Your Report</span>
                  </>
                ) : report.has_confirmed ? (
                  <>
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Confirmed</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </div>
          );
        })}

        {/* Empty state fallback */}
        {sortedReports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <MessageSquare className="h-8 w-8 stroke-[1.5]" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider">
              No reports registered yet in {activeArea.name}
            </p>
          </div>
        )}
      </div>

      {/* Expand Button ("View More Activity") */}
      {sortedReports.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((prev) => prev + 3)}
          className="w-full h-11 border border-dashed border-slate-200 hover:border-slate-300 rounded-2xl flex items-center justify-center font-bold text-xs text-slate-500 hover:text-slate-700 bg-white/30 hover:bg-white/50 transition-all duration-200 cursor-pointer"
        >
          View More Activity
        </button>
      )}

    </div>
  );
}
