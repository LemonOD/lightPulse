"use client";

import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useSupabaseRealtime();
  
  return <>{children}</>;
}
