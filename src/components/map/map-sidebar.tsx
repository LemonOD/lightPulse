"use client";

import { Search, Plus } from "lucide-react";
import { Area, ReportStatus } from "@/lib/types";
import AddressAutocomplete, { GeocodedPlace } from "../shared/address-autocomplete";
import { addLiveAreas } from "@/store/slices/dataSlice";
import UserProfileCard from "../home/user-profile-card";
import UptimeChart from "../shared/uptime-chart";
import { useAppSelector, useAppDispatch } from "@/store";

interface MapSidebarProps {
  mapSearch: string;
  setMapSearch: (val: string) => void;
  filteredMapAreas: (Area & { status: ReportStatus; timeAgo: string; detailLabel: string })[];
  selectedAreaId: string | null;
  handleSelectArea: (areaId: string) => void;
  handleOpenReportModal: () => void;
  activeArea: (Area & { status: ReportStatus }) | null;
  getBadgeColor: (status: string) => string;
}

export default function MapSidebar({
  mapSearch,
  setMapSearch,
  filteredMapAreas,
  selectedAreaId,
  handleSelectArea,
  handleOpenReportModal,
  activeArea,
  getBadgeColor,
}: MapSidebarProps) {
  const dispatch = useAppDispatch();
  const allReports = useAppSelector((state) => state.data.reports);
  const activeAreaReports = allReports.filter((r) => activeArea && r.area_id === activeArea.id);

  const handleSelectPlace = (place: GeocodedPlace) => {
    const selectedArea = {
      id: place.id,
      name: place.name,
      slug: place.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      lat: place.lat,
      lng: place.lng,
      description: place.description || "Lagos, Nigeria",
      region: "Searched Address"
    };

    // Dispatch geocoded location to data state
    dispatch(addLiveAreas([selectedArea]));
    // Center map & set as active area focus
    handleSelectArea(selectedArea.id);
  };

  return (
    <div className="hidden md:flex w-full md:w-96 shrink-0 flex-col bg-white/70 backdrop-blur-md border border-slate-100 p-5 rounded-3xl glass-shadow md:h-full md:overflow-hidden dark:bg-black dark:border-gray-800">
      {/* Autocomplete Address Search Header Input */}
      <div className="relative mb-5">
        <AddressAutocomplete
          placeholder="Search addresses, estates, malls..."
          onSelectPlace={handleSelectPlace}
          onClear={() => setMapSearch("")}
          onChangeQuery={setMapSearch}
          initialValue={mapSearch}
          inputClassName="w-full h-11 pl-10 pr-10 rounded-2xl border border-slate-100 bg-white placeholder-slate-400 focus:outline-none focus:border-slate-200 focus:ring-1 focus:ring-slate-200 text-xs font-semibold tracking-wide dark:bg-black dark:border-slate-700 dark:focus:bg-slate-900 dark:focus:border-slate-500 dark:text-slate-300"
          iconSizeClassName="h-4 w-4"
          iconLeftClassName="left-3.5"
        />
      </div>

      {/* Scrollable list of neighborhood statuses */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 pb-4">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 px-1 mb-1">
          Nearby Status
        </span>

        {filteredMapAreas.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelectArea(item.id)}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 transform active:scale-99 flex flex-col gap-2 ${
              selectedAreaId === item.id
                ? "bg-white dark:bg-black border-[#22C55E] border-2"
                : "bg-white/50 border-slate-200 hover:border-slate-200 hover:bg-white/80 dark:bg-black/50 dark:border-slate-800 dark:hover:border-slate-600 dark:hover:bg-black/80"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-extrabold text-slate-800 tracking-tight dark:text-slate-500">
                {item.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${getBadgeColor(
                  item.status
                )}`}
              >
                {item.status === "LIGHT_AVAILABLE"
                  ? "STABLE"
                  : item.status === "LIGHT_OUT"
                  ? "OUTAGE"
                  : item.status === "LOW_VOLTAGE"
                  ? "UNSTABLE"
                  : "UNKNOWN"}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400">{item.timeAgo}</span>
              <span
                className={`text-[9px] font-bold tracking-wide flex items-center gap-1 ${
                  item.status === "LIGHT_AVAILABLE"
                    ? "text-[#22C55E]"
                    : item.status === "LIGHT_OUT"
                    ? "text-red-500"
                    : item.status === "LOW_VOLTAGE"
                    ? "text-amber-500"
                    : "text-slate-400"
                }`}
              >
                <span className="h-1 w-1 rounded-full bg-current" />
                {item.detailLabel}
              </span>
            </div>
          </div>
        ))}

        {filteredMapAreas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-[10px] font-bold uppercase tracking-wider gap-2">
            <Search className="h-6 w-6 text-slate-300" />
            <span>No areas match search</span>
          </div>
        )}
      </div>

      {/* Action Button: "+ Report Status" */}
      {activeArea && (
        <div className="flex flex-col gap-4 mt-4">
          {/* <UserProfileCard /> */}
          <UptimeChart reports={activeAreaReports} currentStatus={activeArea.status} />
          <button
            onClick={handleOpenReportModal}
            className="w-full h-12 bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs tracking-wider rounded-2xl shadow-md shadow-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Report Status
          </button>
        </div>
      )}
    </div>
  );
}
