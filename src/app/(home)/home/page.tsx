"use client";

import StatusCard from "@/components/home/status-card";
import ReportForm from "@/components/home/report-form";
import UptimeTrend from "@/components/home/uptime-trend";
import MapPreview from "@/components/home/map-preview";
import ActivityFeed from "@/components/home/activity-feed";
import { useAutoLocation } from "@/hooks/use-auto-location";

export default function Home() {
  useAutoLocation();
  return (
    <main className="flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 md:py-10">
      
      <div className="flex flex-col gap-6 md:hidden">
        <StatusCard />
        <ReportForm />
        <UptimeTrend />
        <ActivityFeed />
      </div>

      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 flex flex-col gap-8">
          <StatusCard />
          
          <div className="backdrop-blur-md glass-shadow">
            <ReportForm />
          </div>

          <UptimeTrend />
        </div>

        <div className="flex flex-col gap-8">
          <MapPreview />
          
          <ActivityFeed />
        </div>

      </div>

    </main>
  );
}
