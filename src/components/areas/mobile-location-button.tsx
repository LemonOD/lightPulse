"use client";

interface MobileLocationButtonProps {
  handleDetectLocation: () => void;
  isLocating: boolean;
}

export default function MobileLocationButton({
  handleDetectLocation,
  isLocating
}: MobileLocationButtonProps) {
  return (
    <div className="md:hidden fixed bottom-10 left-0 right-0 z-30 px-4 pb-6 pt-4 bg-linear-to-t from-white via-white/95 to-white/0 pointer-events-none">
      <button
        onClick={handleDetectLocation}
        disabled={isLocating}
        className={`pointer-events-auto w-full h-13 rounded-2xl font-bold text-sm tracking-wide text-white transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md shadow-emerald-900/10 ${
          isLocating
            ? "bg-emerald-800/80 cursor-default"
            : "bg-[#0A5C36] hover:bg-emerald-950 cursor-pointer"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-5 w-5 ${isLocating ? "animate-spin" : ""}`}
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="1" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
        </svg>
        {isLocating ? "Locating GPS..." : "Detect My Location"}
      </button>
    </div>
  );
}
