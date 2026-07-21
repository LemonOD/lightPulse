"use client";

import { useEffect, useState, useRef } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { dismissPwaPrompt } from "@/store/slices/appSlice";

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "other";
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

const DISMISSED_KEY = "lightpulse_pwa_banner_dismissed";

export default function PWAInstallBanner() {
  const dispatch = useDispatch();
  const showPwaPrompt = useSelector((state: RootState) => state.app.showPwaPrompt);
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // If currently running as PWA, remember they installed it, and don't show
    if (isInStandaloneMode()) {
      localStorage.setItem("lightpulse_pwa_installed", "true");
      return;
    }

    // Don't show if we know they already installed it
    if (localStorage.getItem("lightpulse_pwa_installed") === "true") return;

    // Don't show if user already dismissed it this session
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === "android") {
      // Listen for Chrome's install prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }
  }, []);

  const handleDismiss = () => {
    dispatch(dismissPwaPrompt());
    sessionStorage.setItem(DISMISSED_KEY, "true");
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstalling(false);
    if (outcome === "accepted") {
      localStorage.setItem("lightpulse_pwa_installed", "true");
      dispatch(dismissPwaPrompt());
    }
  };

  if (!showPwaPrompt) return null;

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
      role="complementary"
      aria-label="Install app banner"
    >
      <div
        className="pointer-events-auto w-full max-w-sm rounded-2xl bg-slate-900 shadow-2xl border border-slate-700/50 overflow-hidden"
        style={{
          animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <div className="shrink-0 h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-xl">⚡</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">
              Install LightPulse
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">
              {platform === "ios"
                ? "Add to your home screen for instant access."
                : "Get instant access right from your home screen."}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Dismiss install prompt"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Android CTA */}
        {platform === "android" && (
          <div className="px-4 pb-4">
            <button
              id="pwa-install-btn"
              onClick={handleAndroidInstall}
              disabled={isInstalling}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white text-xs font-bold tracking-wide transition-all duration-200 disabled:opacity-60 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              {isInstalling ? "Installing..." : "Add to Home Screen"}
            </button>
          </div>
        )}

        {/* iOS Instructions */}
        {platform === "ios" && (
          <div className="px-4 pb-4">
            {!showIOSSteps ? (
              <button
                id="pwa-ios-steps-btn"
                onClick={() => setShowIOSSteps(true)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer"
              >
                <span>Show me how</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
                  <div className="shrink-0 h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300">1</div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <span>Tap the</span>
                    <span className="inline-flex items-center justify-center bg-slate-600 rounded-md px-1.5 py-0.5">
                      <Share className="h-3 w-3 text-blue-400" />
                    </span>
                    <span><strong className="text-white">Share</strong> button</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
                  <div className="shrink-0 h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300">2</div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <span>Scroll and tap</span>
                    <span className="inline-flex items-center gap-1 bg-slate-600 rounded-md px-1.5 py-0.5">
                      <Plus className="h-3 w-3 text-slate-300" />
                      <span className="text-white font-bold text-[10px]">Add to Home Screen</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
                  <div className="shrink-0 h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300">3</div>
                  <p className="text-xs text-slate-300 font-medium">
                    Tap <strong className="text-white">Add</strong> to install LightPulse ⚡
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
