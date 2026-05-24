"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import { Zap, MapPin } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const currentRegion = useAppSelector((state) => state.app.currentRegion);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Map", href: "/map" },
    { name: "Areas", href: "/areas" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className=" flex  h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* MOBILE HEADER: Styled exactly like the screenshot */}
        <div className="flex md:hidden w-full items-center justify-between">
          <div className="relative group">
            <button className="flex items-center gap-2 text-emerald-500 font-extrabold text-base transition-colors select-none">
              <Zap className="h-5 w-5 fill-current" />
              <span>{currentRegion}</span>
            </button>
            

          </div>
        </div>

        {/* DESKTOP HEADER (remains fully functional) */}
        <div className="hidden md:flex w-full items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#22C55E] transition-all duration-300 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white glass-shadow">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900">
                Lyt<span className="text-[#22C55E]">Pulse</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="flex items-center gap-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-[#22C55E] text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Region & Profile Controls */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all duration-200 glass-shadow">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{currentRegion}</span>
              </button>
              
              {/* Simple dropdown menu */}

            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
