"use client";

import { useNetwork } from "@/hooks/useNetwork";
import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const isOnline = useNetwork();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-rose-500 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top">
      <WifiOff className="h-4 w-4" />
      You are currently offline. Some features may not work.
    </div>
  );
}
