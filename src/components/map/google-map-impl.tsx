/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { Area, ReportStatus } from "@/lib/types";
import { setSelectedAreaId } from "@/store/slices/appSlice";
import { useAppDispatch } from "@/store";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapProps {
  areas: (Area & { status: ReportStatus })[];
  selectedAreaId: string | null;
  userLocation?: [number, number] | null;
  centerOnUser?: boolean;
  apiKey: string;
}

export default function GoogleMapImpl({
  areas,
  selectedAreaId,
  userLocation = null,
  centerOnUser = false,
  apiKey
}: GoogleMapProps) {
  const dispatch = useAppDispatch();
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userOverlayRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  // Dynamic Google Maps Javascript SDK script loader
  useEffect(() => {
    if (window.google?.maps) {
      setLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      const handleScriptLoad = () => setLoaded(true);
      existingScript.addEventListener("load", handleScriptLoad);
      return () => {
        existingScript.removeEventListener("load", handleScriptLoad);
      };
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=en`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Failed to load Google Maps SDK");
    document.head.appendChild(script);
  }, [apiKey]);

  const getMarkerHtml = (status: ReportStatus, name: string) => {
    const colorMap = {
      LIGHT_AVAILABLE: "#22c55e",
      LIGHT_OUT: "#ef4444",
      LOW_VOLTAGE: "#f59e0b",
      UNKNOWN: "#6b7280"
    };
    
    const iconColor = colorMap[status] || colorMap.UNKNOWN;
    
    const svgMarkup = status === "LIGHT_AVAILABLE" 
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style="width: 18px; height: 18px;"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`
      : status === "LIGHT_OUT"
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>`
      : status === "LOW_VOLTAGE"
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

    const cleanName = name === "Yaba Central" ? "YABA TECH" : name.toUpperCase();

    return `<div class="flex flex-col items-center justify-center relative font-sans">
              <div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-300 transform hover:scale-115 active:scale-95" style="background-color: ${iconColor};">
                ${svgMarkup}
              </div>
              <div class="mt-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-100 shadow-sm text-[8px] font-black text-slate-800 uppercase tracking-widest text-center whitespace-nowrap leading-none select-none">
                ${cleanName}
              </div>
            </div>`;
  };

  const getPopupHtml = (area: Area & { status: ReportStatus }) => {
    const statusColor = area.status === "LIGHT_AVAILABLE" ? "bg-emerald-500" :
                        area.status === "LIGHT_OUT" ? "bg-red-500" :
                        area.status === "LOW_VOLTAGE" ? "bg-amber-500" : "bg-slate-300";
    
    const statusLabel = area.status === "LIGHT_AVAILABLE" ? "ONLINE" :
                        area.status === "LIGHT_OUT" ? "OUTAGE" :
                        area.status === "LOW_VOLTAGE" ? "FLUCTUATING" : "UNKNOWN";

    return `<div class="flex flex-col gap-1.5 p-1 font-sans text-slate-800 min-w-[140px]">
              <span class="text-sm font-extrabold tracking-tight leading-none text-slate-800">
                ${area.name}
              </span>
              <span class="text-[10px] font-bold text-slate-400 leading-normal">
                ${area.description}
              </span>
              <div class="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                <span class="h-2.5 w-2.5 rounded-full ${statusColor}"></span>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  ${statusLabel}
                </span>
              </div>
            </div>`;
  };

  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;

    const google = window.google;
    
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 6.5095, lng: 3.3711 },
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT
      },
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    mapInstanceRef.current = map;
  }, [loaded]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !loaded) return;

    const google = window.google;

    class CustomHTMLOverlay extends google.maps.OverlayView {
      latlng: any;
      html: string;
      onClick: () => void;
      div: HTMLDivElement | null = null;

      constructor(latlng: any, html: string, onClick: () => void, targetMap: any) {
        super();
        this.latlng = latlng;
        this.html = html;
        this.onClick = onClick;
        this.setMap(targetMap);
      }

      onAdd() {
        const overlayDiv = document.createElement("div");
        overlayDiv.style.position = "absolute";
        overlayDiv.style.cursor = "pointer";
        overlayDiv.style.zIndex = "10";
        overlayDiv.innerHTML = this.html;
        this.div = overlayDiv;

        const panes = this.getPanes();
        if (panes) {
          panes.overlayMouseTarget.appendChild(overlayDiv);
        }

        overlayDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          this.onClick();
        });
      }

      draw() {
        const overlayProjection = this.getProjection();
        if (!overlayProjection || !this.div) return;

        const position = overlayProjection.fromLatLngToDivPixel(this.latlng);
        if (position) {
          this.div.style.left = (position.x - 40) + "px";
          this.div.style.top = (position.y - 30) + "px";
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    class UserLocationOverlay extends google.maps.OverlayView {
      latlng: any;
      html: string;
      div: HTMLDivElement | null = null;

      constructor(latlng: any, html: string, targetMap: any) {
        super();
        this.latlng = latlng;
        this.html = html;
        this.setMap(targetMap);
      }

      onAdd() {
        const overlayDiv = document.createElement("div");
        overlayDiv.style.position = "absolute";
        overlayDiv.innerHTML = this.html;
        this.div = overlayDiv;

        const panes = this.getPanes();
        if (panes) {
          panes.overlayMouseTarget.appendChild(overlayDiv);
        }
      }

      draw() {
        const overlayProjection = this.getProjection();
        if (!overlayProjection || !this.div) return;

        const position = overlayProjection.fromLatLngToDivPixel(this.latlng);
        if (position) {
          this.div.style.left = (position.x - 12) + "px";
          this.div.style.top = (position.y - 12) + "px";
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (userOverlayRef.current) {
      userOverlayRef.current.setMap(null);
      userOverlayRef.current = null;
    }

    areas.forEach((area) => {
      const latlng = new google.maps.LatLng(area.lat, area.lng);
      const markerHtml = getMarkerHtml(area.status, area.name);
      
      const overlay = new CustomHTMLOverlay(
        latlng,
        markerHtml,
        () => {
          dispatch(setSelectedAreaId(area.id));
        },
        map
      );

      markersRef.current.push(overlay);
    });

    if (userLocation) {
      const userLatLng = new google.maps.LatLng(userLocation[0], userLocation[1]);
      const pulsingHtml = `<div class="relative flex items-center justify-center h-6 w-6">
                            <span class="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-white shadow-lg"></span>
                          </div>`;
      
      const userOverlay = new UserLocationOverlay(userLatLng, pulsingHtml, map);
      userOverlayRef.current = userOverlay;
    }
  }, [areas, userLocation, loaded, dispatch]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !loaded) return;

    const google = window.google;

    if (centerOnUser && userLocation) {
      map.panTo({ lat: userLocation[0], lng: userLocation[1] });
      map.setZoom(15);
    } else if (selectedAreaId) {
      const target = areas.find(a => a.id === selectedAreaId);
      if (target) {
        map.panTo({ lat: target.lat, lng: target.lng });
        map.setZoom(15);

        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }

        const infoWindow = new google.maps.InfoWindow({
          content: getPopupHtml(target),
          pixelOffset: new google.maps.Size(0, -24)
        });

        infoWindow.setPosition({ lat: target.lat, lng: target.lng });
        infoWindow.open(map);
        infoWindowRef.current = infoWindow;
      }
    }
  }, [selectedAreaId, userLocation, centerOnUser, loaded, areas]);

  if (error) {
    return (
      <div className="h-full w-full rounded-3xl bg-slate-100 flex items-center justify-center font-bold text-xs text-red-500 p-6 border border-slate-200">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative rounded-none md:rounded-3xl overflow-hidden md:glass-shadow">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
