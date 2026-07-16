"use client";

import { SlidersHorizontal } from "lucide-react";
import AddressAutocomplete, { GeocodedPlace } from "../shared/address-autocomplete";

interface MobileSearchBarProps {
  mapSearch: string;
  setMapSearch: (val: string) => void;
  showLegendMobile: boolean;
  setShowLegendMobile: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelectPlace: (place: GeocodedPlace) => void;
  onAutocompleteOpenChange?: (isOpen: boolean) => void;
}

export default function MobileSearchBar({
  mapSearch,
  setMapSearch,
  showLegendMobile,
  setShowLegendMobile,
  handleSelectPlace,
  onAutocompleteOpenChange,
}: MobileSearchBarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 md:hidden bg-white border border-slate-100 rounded-2xl shadow-lg h-14 flex items-center justify-between px-3 pointer-events-auto dark:bg-black dark:border-slate-600">
      <AddressAutocomplete
        placeholder="Search addresses or estates..."
        onSelectPlace={handleSelectPlace}
        onClear={() => setMapSearch("")}
        onChangeQuery={setMapSearch}
        initialValue={mapSearch}
        onOpenChange={onAutocompleteOpenChange}
        className="relative flex-1 min-w-0 group"
        inputClassName="w-full h-11 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-100 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:bg-white focus:border-emerald-500 transition-all text-slate-800 leading-none dark:bg-black dark:border-slate-700 dark:focus:bg-slate-900 dark:focus:border-slate-500"
        iconSizeClassName="h-4.5 w-4.5"
        iconLeftClassName="left-3"
      />
      
      <button
        onClick={() => setShowLegendMobile((prev) => !prev)}
        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2 ${
          showLegendMobile
            ? "bg-emerald-500 text-white"
            : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        }`}
      >
        <SlidersHorizontal className="h-4.5 w-4.5 stroke-[2.25]" />
      </button>
    </div>
  );
}
