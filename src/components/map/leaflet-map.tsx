"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import { Area, ReportStatus } from "@/lib/mockData";
import { setSelectedAreaId } from "@/store/slices/appSlice";
import { useAppDispatch } from "@/store";

interface LeafletMapProps {
  areas: (Area & { status: ReportStatus })[];
  selectedAreaId: string | null;
  userLocation?: [number, number] | null;
  centerOnUser?: boolean;
}

// Controller component to pan/zoom when selectedAreaId or userLocation changes
function MapController({
  selectedAreaId,
  areas,
  userLocation,
  centerOnUser
}: {
  selectedAreaId: string | null;
  areas: (Area & { status: ReportStatus })[];
  userLocation?: [number, number] | null;
  centerOnUser?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (centerOnUser && userLocation) {
      map.setView(userLocation, 15, {
        animate: true,
        duration: 1.2
      });
    } else if (selectedAreaId) {
      const target = areas.find(a => a.id === selectedAreaId);
      if (target) {
        map.setView([target.lat, target.lng], 15, {
          animate: true,
          duration: 1.2
        });
      }
    }
  }, [selectedAreaId, areas, map, userLocation, centerOnUser]);

  return null;
}

export default function LeafletMap({
  areas,
  selectedAreaId,
  userLocation = null,
  centerOnUser = false
}: LeafletMapProps) {
  const dispatch = useAppDispatch();

  // Lagos default coordinates center
  const centerPosition: [number, number] = [6.5095, 3.3711];

  // Custom User Location pulsing radar icon
  const userLocationIcon = L.divIcon({
    html: `<div class="relative flex items-center justify-center h-6 w-6">
             <span class="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
             <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-white shadow-lg"></span>
           </div>`,
    className: "user-location-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // Helper to compile dynamic premium HTML DivIcons for each status
  const getMarkerIcon = (status: ReportStatus, name: string) => {
    const colorMap = {
      stable: "#22c55e",
      outage: "#ef4444",
      unstable: "#f59e0b",
      unknown: "#6b7280"
    };
    
    const iconColor = colorMap[status] || colorMap.unknown;
    
    // Status custom vector marks matching mockups
    const svgMarkup = status === "stable" 
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="h-4.5 w-4.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`
      : status === "outage"
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-4.5 w-4.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>`
      : status === "unstable"
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-4.5 w-4.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

    // Format Sabo, Ojuelegba, Akoka names for perfect mockup matching
    const cleanName = name === "Yaba Central" ? "YABA TECH" : name.toUpperCase();

    return L.divIcon({
      html: `<div class="flex flex-col items-center justify-center relative">
               <div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-300 transform hover:scale-115 active:scale-95" style="background-color: ${iconColor};">
                 ${svgMarkup}
               </div>
               <div class="mt-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-100 shadow-sm text-[8px] font-black text-slate-800 uppercase tracking-widest text-center whitespace-nowrap leading-none select-none">
                 ${cleanName}
               </div>
             </div>`,
      className: "custom-leaflet-icon",
      iconSize: [80, 60],
      iconAnchor: [40, 18],
      popupAnchor: [0, -18]
    });
  };

  return (
    <div className="h-full w-full relative rounded-none md:rounded-3xl overflow-hidden md:glass-shadow">
      <MapContainer
        center={centerPosition}
        zoom={13}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <LayersControl position="topright">
          {/* Default Layer: Hybrid Satellite Map showing streets, estates, and labels */}
          <LayersControl.BaseLayer checked name="Satellite Hybrid">
            <>
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={20}
              />
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={20}
              />
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                maxZoom={20}
              />
            </>
          </LayersControl.BaseLayer>

          {/* Pure Satellite Imagery Layer */}
          <LayersControl.BaseLayer name="Satellite Imagery">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* Clean Voyager Vector Layer */}
          <LayersControl.BaseLayer name="Vector Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Pulsing User Geolocation Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup>
              <div className="flex flex-col gap-1 p-1 font-sans">
                <span className="text-xs font-black text-slate-800 tracking-tight leading-none uppercase">
                  Your Location
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  Accuracy calibrated via browser GPS
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dynamic Interactive Markers */}
        {areas.map((area) => (
          <Marker
            key={area.id}
            position={[area.lat, area.lng]}
            icon={getMarkerIcon(area.status, area.name)}
            eventHandlers={{
              click: () => {
                dispatch(setSelectedAreaId(area.id));
              }
            }}
          >
            <Popup>
              <div className="flex flex-col gap-1.5 p-1 font-sans">
                <span className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">
                  {area.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {area.description}
                </span>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    area.status === "stable" ? "bg-emerald-500" :
                    area.status === "outage" ? "bg-red-500" :
                    area.status === "unstable" ? "bg-amber-500" : "bg-slate-300"
                  }`} />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    {area.status === "stable" ? "ONLINE" : area.status === "outage" ? "OUTAGE" : area.status === "unstable" ? "FLUCTUATING" : "UNKNOWN"}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Map Pan / Zoom active controller */}
        <MapController
          selectedAreaId={selectedAreaId}
          areas={areas}
          userLocation={userLocation}
          centerOnUser={centerOnUser}
        />

      </MapContainer>
    </div>
  );
}
