"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Building2 } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Map", href: "/map", icon: Map },
    { name: "Areas", href: "/areas", icon: Building2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-100 px-6 py-2 pb-safe flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center  rounded-xl cursor-pointer py-1 ${
              isActive 
                ? "bg-[#22C55E] text-white scale-105" 
                : "bg-transparent text-slate-400"
            }`}
          >
            <div className={`px-4 py-1 rounded-2xl transition-all duration-300 `}>
              <Icon className="h-5 w-5 stroke-[2.25]" />
            </div>
            <span className={`text-[10px] font-semibold transition-colors duration-300 `}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
