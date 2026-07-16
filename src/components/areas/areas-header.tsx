"use client";

import { Compass } from "lucide-react";
import AddressAutocomplete, {
  GeocodedPlace,
} from "../shared/address-autocomplete";
import { useAppDispatch } from "@/store";
import { addLiveAreas } from "@/store/slices/dataSlice";
import { setSelectedAreaId } from "@/store/slices/appSlice";
import { useRouter } from "next/navigation";

interface AreasHeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  handleDetectLocation: () => void;
  isLocating: boolean;
}

export default function AreasHeader({
  searchQuery,
  onSearchChange,
  handleDetectLocation,
  isLocating,
}: AreasHeaderProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSelectPlace = (place: GeocodedPlace) => {
    const selectedArea = {
      id: place.id,
      name: place.name,
      slug: place.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      lat: place.lat,
      lng: place.lng,
      description: place.description || "Lagos, Nigeria",
      region: "Searched Address",
    };

    // Add geolocated place to Redux store
    dispatch(addLiveAreas([selectedArea]));
    // Set as active neighborhood focus
    dispatch(setSelectedAreaId(selectedArea.id));

    // Redirect smoothly to dashboard
    router.push("/");
  };

  return (
    <>
      {/* Title Header Grid - Hidden on Mobile viewports */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
            Neighborhood Directory
          </h1>
          <p className="text-sm font-medium text-slate-500 leading-relaxed mt-2 max-w-xl">
            Browse the real-time power status of all residential and commercial
            districts across Lagos.
          </p>
        </div>

        {/* Detect Location Button - Desktop/Tablet */}
        <button
          onClick={handleDetectLocation}
          disabled={isLocating}
          className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-medium text-xs tracking-wider border transition-all duration-300 transform active:scale-95 ${
            isLocating
              ? "bg-emerald-100 text-emerald-600 border-emerald-200 cursor-default"
              : "text-[#109541] border-[#109541] hover:bg-emerald-50 cursor-pointer"
          }`}
        >
          <Compass className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
          {isLocating ? "Locating GPS..." : "Detect My Location"}
        </button>
      </div>

      {/* Large Input Address Autocomplete Search Box */}
      <div className="relative mb-8">
        <AddressAutocomplete
          placeholder="Search addresses, landmarks, or estates in Lagos..."
          onSelectPlace={handleSelectPlace}
          onClear={() => onSearchChange("")}
          onChangeQuery={onSearchChange}
          initialValue={searchQuery}
          inputClassName=" w-full h-14 pl-12 pr-10 rounded-xl border border-slate-200 bg-white placeholder-slate-400 text-sm font-medium transition-all dark:text-white dark:bg-black dark:border-slate-700 dark:focus:bg-slate-900 dark:focus:border-slate-500"
          iconSizeClassName="h-4.5 w-4.5"
        />
      </div>
    </>
  );
}
