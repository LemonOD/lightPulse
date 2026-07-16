"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";

export interface GeocodedPlace {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
}

interface AutocompleteSuggestion {
  id: string;
  name: string;
  description: string;
  lat?: number;
  lng?: number;
  isGoogle: boolean;
}

interface AddressAutocompleteProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  iconSizeClassName?: string;
  iconLeftClassName?: string;
  onSelectPlace: (place: GeocodedPlace) => void;
  onClear?: () => void;
  onChangeQuery?: (val: string) => void;
  initialValue?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

// Custom debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function AddressAutocomplete({
  placeholder = "Search addresses or landmarks...",
  className = "relative w-full group",
  inputClassName = "w-full h-14 pl-12 pr-10 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-slate-250 text-sm font-medium transition-all",
  iconSizeClassName = "h-5 w-5",
  iconLeftClassName = "left-4",
  onSelectPlace,
  onClear,
  onChangeQuery,
  initialValue = "",
  onOpenChange
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen && suggestions.length > 0);
    }
  }, [isOpen, suggestions.length, onOpenChange]);

  // Sync raw input text updates with parent immediately for local list filtering
  useEffect(() => {
    if (onChangeQuery) {
      onChangeQuery(query);
    }
  }, [query, onChangeQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch search completions: try Google Places proxy first, fallback to OSM Photon if key is missing or failed
  useEffect(() => {
    let active = true;

    if (!debouncedQuery.trim() || debouncedQuery.length <= 3) {
      Promise.resolve().then(() => {
        if (active) {
          setSuggestions([]);
          setIsOpen(false);
          setIsLoading(false);
        }
      });
      return;
    }

    Promise.resolve().then(() => {
      if (active) {
        setIsLoading(true);
      }
    });

    const fetchSuggestions = async () => {
      try {
        // 1. Attempt Google Places Autocomplete API via server-side proxy
        const response = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(debouncedQuery)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.error === "API_KEY_MISSING") {
            // Google Key is unconfigured, trigger transparent fallback to Photon OSM API
            console.info("Google Maps API Key is missing. Falling back to OpenStreetMap Photon geocoder.");
            await fetchPhotonFallback();
            return;
          }

          // If Google returned an API error status (e.g. REQUEST_DENIED, OVER_QUERY_LIMIT, etc.)
          if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            console.warn(`Google Places API returned error status: ${data.status}. Falling back to OpenStreetMap Photon.`);
            await fetchPhotonFallback();
            return;
          }

          if (data && Array.isArray(data.predictions)) {
            // If predictions list is empty but status was not explicitly ZERO_RESULTS, try Photon as a backup
            if (data.predictions.length === 0 && data.status !== "ZERO_RESULTS") {
              await fetchPhotonFallback();
              return;
            }

            interface GooglePrediction {
              place_id: string;
              description: string;
              structured_formatting?: {
                main_text: string;
                secondary_text?: string;
              };
            }

            const parsedPlaces = data.predictions.map((pred: GooglePrediction) => {
              const mainText = pred.structured_formatting?.main_text || "Search Location";
              const secondaryText = pred.structured_formatting?.secondary_text || pred.description;
              
              return {
                id: pred.place_id,
                name: mainText,
                description: secondaryText,
                isGoogle: true
              };
            });

            if (active) {
              setSuggestions(parsedPlaces);
              setIsOpen(parsedPlaces.length > 0);
            }
            return;
          }
        }
        
        // If Google API failed (non-200 or no predictions), fall back to Photon geocoding
        await fetchPhotonFallback();

      } catch (error) {
        console.warn("Google Places proxy failed, trying Photon fallback:", error);
        await fetchPhotonFallback();
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    // Helper to query OpenStreetMap-backed Photon API
    const fetchPhotonFallback = async () => {
      try {
        const fallbackRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(debouncedQuery)}&limit=6&lat=6.5244&lon=3.3792&location_bias_scale=0.3`,
          {
            headers: {
              "Accept-Language": "en"
            }
          }
        );

        if (fallbackRes.ok && active) {
          const data = await fallbackRes.json();
          if (data && Array.isArray(data.features)) {
            interface PhotonFeature {
              geometry: {
                coordinates: [number, number]; // [lon, lat]
              };
              properties: {
                osm_id: number;
                osm_type: string;
                name?: string;
                street?: string;
                locality?: string;
                district?: string;
                city?: string;
                state?: string;
                country?: string;
              };
            }

            const parsedPlaces = data.features.map((feature: PhotonFeature) => {
              const props = feature.properties;
              const coords = feature.geometry.coordinates; // [lon, lat]
              
              const addrParts = [];
              if (props.street) addrParts.push(props.street);
              if (props.district) addrParts.push(props.district);
              if (props.locality) addrParts.push(props.locality);
              if (props.city) addrParts.push(props.city);
              if (props.state) addrParts.push(props.state);
              
              const name = props.name || props.street || props.locality || "Unnamed Place";
              const desc = addrParts.filter(p => p !== name).slice(0, 3).join(", ") || props.country || "Lagos, Nigeria";

              return {
                id: `photon-${props.osm_type}-${props.osm_id}-${Math.random().toString(36).substr(2, 5)}`,
                name: name,
                description: desc,
                lat: coords[1], // Latitude is coords[1] in GeoJSON
                lng: coords[0], // Longitude is coords[0] in GeoJSON
                isGoogle: false
              };
            });

            setSuggestions(parsedPlaces);
            setIsOpen(parsedPlaces.length > 0);
          } else {
            setSuggestions([]);
          }
        }
      } catch (err) {
        console.error("Photon Geocoding fallback lookup failed:", err);
        if (active) {
          setSuggestions([]);
        }
      }
    };

    fetchSuggestions();

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const handleSelect = async (place: AutocompleteSuggestion) => {
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);

    if (place.isGoogle) {
      // For Google suggestions, geocode via Details API proxy to extract precise lat/lng
      setIsLoading(true);
      try {
        const res = await fetch(`/api/places/details?placeId=${place.id}`);
        if (res.ok) {
          const data = await res.json();
          
          if (data.error === "API_KEY_MISSING" || data.status === "REQUEST_DENIED") {
            throw new Error(data.status || "Google Details API key missing");
          }

          const geometry = data.result?.geometry;
          
          if (geometry && geometry.location) {
            const { lat, lng } = geometry.location;
            
            setQuery(place.name);
            onSelectPlace({
              id: place.id,
              name: place.name,
              description: place.description || "Lagos, Nigeria",
              lat,
              lng
            });
          } else {
            throw new Error("Missing geometry coordinates in details response");
          }
        } else {
          throw new Error(`Google details responded with status ${res.status}`);
        }
      } catch (err) {
        console.error("Failed to fetch Google Place details, trying Photon geocoder fallback:", err);
        
        // Try to geocode the selected Google place description via Photon
        try {
          const fallbackRes = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(place.name + " " + place.description)}&limit=1`,
            {
              headers: {
                "Accept-Language": "en"
              }
            }
          );
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            if (data && Array.isArray(data.features) && data.features.length > 0) {
              const feature = data.features[0];
              const coords = feature.geometry.coordinates; // [lon, lat]
              
              onSelectPlace({
                id: place.id,
                name: place.name,
                description: place.description,
                lat: coords[1], // Latitude is coords[1] in GeoJSON
                lng: coords[0]  // Longitude is coords[0] in GeoJSON
              });
              setQuery(place.name);
              return;
            }
          }
        } catch (photonErr) {
          console.error("Photon geocoder fallback also failed:", photonErr);
        }
        
        setQuery(place.name);
      } finally {
        setIsLoading(false);
      }
    } else {
      // For Photon suggestions, lat/lng coordinates are already present in suggestion payload
      setQuery(place.name);
      onSelectPlace({
        id: place.id,
        name: place.name,
        description: place.description,
        lat: place.lat!,
        lng: place.lng!
      });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    if (onClear) onClear();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 < suggestions.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={className}>
      {/* Icon Indicator */}
      <div className={`absolute ${iconLeftClassName} top-1/2 transform -translate-y-1/2 z-10 text-slate-400 group-focus-within:text-slate-600 transition-colors pointer-events-none flex items-center`}>
        {isLoading ? (
          <Loader2 className={`${iconSizeClassName} animate-spin`} />
        ) : (
          <Search className={iconSizeClassName} />
        )}
      </div>

      {/* Autocomplete Input Textbox */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(suggestions.length > 0)}
        placeholder={placeholder}
        className={inputClassName}
      />

      {/* Clear Button */}
      {query.length > 0 && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer z-10"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-900/5 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          {suggestions.map((place, idx) => (
            <div
              key={place.id}
              onClick={() => handleSelect(place)}
              className={`flex flex-col gap-0.5 px-3.5 py-2.5 rounded-lg cursor-pointer text-left transition-colors ${
                idx === activeIndex
                  ? "bg-emerald-50 text-emerald-900 font-medium"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold truncate leading-tight select-none">
                  {place.name}
                </span>
                {place.isGoogle && (
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-300 border border-slate-100 px-1 rounded bg-slate-50 shrink-0 select-none">
                    Google
                  </span>
                )}
              </div>
              <span className={`text-[10px] truncate select-none leading-none ${
                idx === activeIndex ? "text-emerald-700" : "text-slate-400"
              }`}>
                {place.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
