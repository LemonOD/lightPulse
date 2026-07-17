"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Report } from "@/lib/types";
import { differenceInHours } from "date-fns";

export default function UptimeChart({ reports, currentStatus }: { reports: Report[], currentStatus?: string }) {
  const data = useMemo(() => {
    // Generate an array of the last 12 hours
    const hours = Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(Date.now() - (11 - i) * 60 * 60 * 1000);
      return {
        id: i,
        hourLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: date,
        uptime: 0,
        status: "UNKNOWN"
      };
    });

    // Populate data with report statuses
    // Sort ascending so the newest report in the hour bucket overwrites the older ones
    const sortedReports = [...reports].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sortedReports.forEach((report) => {
      const diffHours = differenceInHours(new Date(), new Date(report.created_at));
      if (diffHours >= 0 && diffHours < 12) {
        const index = 11 - diffHours;
        if (hours[index]) {
          hours[index].status = report.status;
          // Gamified uptime bar value: 1 for Available, 0.5 for Low Voltage, 0.1 for Out
          if (report.status === "LIGHT_AVAILABLE") hours[index].uptime = 100;
          else if (report.status === "LOW_VOLTAGE") hours[index].uptime = 50;
          else if (report.status === "LIGHT_OUT") hours[index].uptime = 10; // show a small bar
        }
      }
    });

    // Determine initial backward state
    let currentKnown = 0;
    if (currentStatus === "LIGHT_AVAILABLE") currentKnown = 100;
    else if (currentStatus === "LOW_VOLTAGE") currentKnown = 50;
    else if (currentStatus === "LIGHT_OUT") currentKnown = 10;
    else if (hours[11].uptime > 0) currentKnown = hours[11].uptime;

    // Fill blanks with UNKNOWN or carry over state backwards
    for (let i = hours.length - 1; i >= 0; i--) {
      if (hours[i].uptime > 0) {
        currentKnown = hours[i].uptime;
      } else if (currentKnown > 0) {
        hours[i].uptime = currentKnown;
      } else {
        hours[i].uptime = 5; // Minimal bar for unknown
      }
    }

    return hours;
  }, [reports, currentStatus]);

  const getColor = (uptime: number) => {
    if (uptime >= 80) return "#10b981"; // emerald-500
    if (uptime >= 40) return "#f59e0b"; // amber-500
    if (uptime > 5) return "#ef4444";  // red-500
    return "#cbd5e1"; // slate-300
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">12h History</h4>
      </div>
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const label = data.uptime >= 80 ? "Power On" : data.uptime >= 40 ? "Low Voltage" : data.uptime > 5 ? "Power Out" : "No Data";
                  return (
                    <div className="bg-slate-800 dark:bg-slate-950 text-white dark:text-slate-200 text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-slate-700 dark:border-slate-800">
                      {data.hourLabel}: {label}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="uptime" radius={[2, 2, 2, 2]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.uptime)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[9px] font-medium text-slate-400">
        <span>12h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}
