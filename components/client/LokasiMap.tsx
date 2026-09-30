"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Lokasi = {
  id: number;
  name: string;
  category?: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at?: string | null;
  account?: { name: string | null };
};

const CATEGORY_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  gym: {
    label: "🏋️ Fitness Center / Gym",
    bg: "#fef9c3",
    color: "#a16207",
  },
  lapangan: {
    label: "🏟️ Lapangan / Komunitas",
    bg: "#dcfce7",
    color: "#15803d",
  },
  low_impact: {
    label: "🏊 Low-Impact (Jogging / Renang)",
    bg: "#e0f2fe",
    color: "#0369a1",
  },
};

type Props = {
  locations: Lokasi[];
  userPosition: [number, number] | null;
  selectedLocation: Lokasi | null;
  onSelectLocation: (loc: Lokasi) => void;
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildPopup(loc: Lokasi, userPos: [number, number] | null): string {
  let distHtml = "";
  if (userPos && loc.latitude != null && loc.longitude != null) {
    const d = haversine(userPos[0], userPos[1], loc.latitude, loc.longitude);
    const str = d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
    distHtml = `<div style="display:inline-block;background:#dcfce7;padding:2px 8px;border-radius:6px;font-size:11px;color:#16a34a;font-weight:600;margin-bottom:6px;">📍 ${str} dari Anda</div><br/>`;
  }
  const catInfo = loc.category ? CATEGORY_LABELS[loc.category] : null;
  const catHtml = catInfo
    ? `<div style="display:inline-block;background:${catInfo.bg};color:${catInfo.color};padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;margin-bottom:4px;">${catInfo.label}</div>`
    : "";
  const gmapsUrl =
    loc.latitude != null && loc.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`
      : "";
  return `<div style="font-family:system-ui,sans-serif;min-width:170px;">
    ${catHtml}
    <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px;">${loc.name}</div>
    ${loc.address ? `<div style="font-size:11px;color:#666;margin-bottom:6px;">${loc.address}</div>` : ""}
    ${distHtml}
    ${gmapsUrl ? `<a href="${gmapsUrl}" target="_blank" rel="noopener" style="display:inline-block;background:#22c55e;color:white;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;">🗺️ Buka Google Maps</a>` : ""}
  </div>`;
}

export default function LokasiMap({
  locations,
  userPosition,
  selectedLocation,
  onSelectLocation,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: userPosition || [-6.7, 108.55],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    }).addTo(map);

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: 'Labels &copy; Esri',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // User position
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userPosition) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPosition);
    } else {
      userMarkerRef.current = L.circleMarker(userPosition, {
        radius: 8,
        fillColor: "#3b82f6",
        color: "#ffffff",
        weight: 3,
        fillOpacity: 1,
      })
        .addTo(mapRef.current)
        .bindPopup("<strong style='color:#3b82f6;'>📍 Lokasi Anda</strong>");
    }
  }, [userPosition, mapReady]);

  // Sync location markers — clear all & re-add every time
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    // Remove ALL old location markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds: L.LatLng[] = [];

    locations.forEach((loc) => {
      if (loc.latitude == null || loc.longitude == null) return;

      const latlng = L.latLng(loc.latitude, loc.longitude);
      bounds.push(latlng);

      const isSel = selectedLocation?.id === loc.id;

      const circle = L.circleMarker(latlng, {
        radius: isSel ? 14 : 10,
        fillColor: isSel ? "#22c55e" : "#ef4444",
        color: "#ffffff",
        weight: isSel ? 4 : 3,
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup(buildPopup(loc, userPosition), { maxWidth: 280 });

      circle.on("click", () => onSelectLocation(loc));

      markersRef.current.push(circle);
    });

    // Fit bounds
    if (bounds.length > 0) {
      if (userPosition) bounds.push(L.latLng(userPosition[0], userPosition[1]));
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [60, 60],
        maxZoom: 15,
      });
    }
  }, [locations, selectedLocation, userPosition, mapReady, onSelectLocation]);

  // Fly to selected
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (!selectedLocation || selectedLocation.latitude == null || selectedLocation.longitude == null) return;

    mapRef.current.flyTo(
      [selectedLocation.latitude, selectedLocation.longitude],
      16,
      { duration: 0.8 },
    );

    // Find and open the popup for the selected marker
    const idx = locations.findIndex((l) => l.id === selectedLocation.id);
    if (idx !== -1 && markersRef.current[idx]) {
      setTimeout(() => markersRef.current[idx]?.openPopup(), 900);
    }
  }, [selectedLocation, mapReady, locations]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#f0f4f0" }}
    />
  );
}
