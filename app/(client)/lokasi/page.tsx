"use client";

import { useEffect, useState, useCallback, useRef } from "react";

import {
  Search,
  MapPin,
  Navigation,
  Loader2,
  X,
  ChevronDown,
  Map as MapIcon,
  List,
} from "lucide-react";
import dynamic from "next/dynamic";

// Lazy load MapView karena Leaflet hanya bisa di client
const MapView = dynamic(() => import("@/components/client/LokasiMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-card-dark rounded-2xl border border-card-border">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  ),
});

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

const CATEGORY_FILTER_OPTIONS = [
  { id: "", label: "Semua Lokasi", bmiNote: "Semua Kategori" },
  {
    id: "gym",
    label: "🏋️ Fitness Center / Gym",
    bmiNote: "Rekomendasi Underweight (Kurus)",
  },
  {
    id: "lapangan",
    label: "🏟️ Lapangan & Komunitas",
    bmiNote: "Rekomendasi Normal",
  },
  {
    id: "low_impact",
    label: "🏊 Low-Impact (Jogging / Kolam Renang)",
    bmiNote: "Rekomendasi Overweight / Obesitas",
  },
] as const;

const CATEGORY_CARD_BADGE: Record<
  string,
  { label: string; bmiLabel: string; className: string }
> = {
  gym: {
    label: "🏋️ Fitness Center / Gym",
    bmiLabel: "Underweight",
    className: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  },
  lapangan: {
    label: "🏟️ Lapangan / Komunitas",
    bmiLabel: "Normal",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  low_impact: {
    label: "🏊 Low-Impact (Jogging / Renang)",
    bmiLabel: "Overweight / Obesitas",
    className: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
};

export default function LokasiOlahragaPage() {
  const [locations, setLocations] = useState<Lokasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedLocation, setSelectedLocation] = useState<Lokasi | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null,
  );
  const mapSectionRef = useRef<HTMLDivElement>(null);


  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Get user location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Default: Indonesia center
          setUserPosition([-6.2, 106.816]);
        },
      );
    }
  }, []);

  // Read initial ?category= or ?target= from URL if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const cat = sp.get("category");
      const target = sp.get("target");
      if (cat && ["gym", "lapangan", "low_impact"].includes(cat)) {
        setSelectedCategory(cat);
      } else if (target) {
        const mapTarget: Record<string, string> = {
          Kurus: "gym",
          Normal: "lapangan",
          Berlebih: "low_impact",
          Obesitas: "low_impact",
        };
        if (mapTarget[target]) setSelectedCategory(mapTarget[target]);
      }
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/lokasi-olahraga?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data: Lokasi[] = await res.json();
        setLocations(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);



  // Calculate distance (Haversine)
  function getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // Sort by distance if user position available
  const sortedLocations = [...locations].sort((a, b) => {
    if (!userPosition || !a.latitude || !b.latitude) return 0;
    const distA = getDistance(
      userPosition[0],
      userPosition[1],
      a.latitude,
      a.longitude!,
    );
    const distB = getDistance(
      userPosition[0],
      userPosition[1],
      b.latitude,
      b.longitude!,
    );
    return distA - distB;
  });



  return (
    <div className="min-h-screen bg-background-base">
      {/* ── Hero Section ── */}
      <section className="relative bg-background-dark pt-16 pb-20 overflow-hidden border-b border-card-border">
        <div className="absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="max-w-3xl mx-auto px-4 text-center relative z-10 mt-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-black tracking-widest uppercase mb-6">
            <MapPin size={11} className="fill-primary" />
            Rekomendasi Tempat
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-text-light mb-5 leading-tight tracking-tight">
            Lokasi{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-green-300 to-primary">
              Olahraga
            </span>
          </h1>
          <p className="text-text-muted text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Temukan tempat olahraga terbaik di sekitar Anda. Gym, lapangan,
            taman, dan spot olahraga outdoor lainnya.
          </p>

          {/* Search */}
          <div className="flex items-center gap-3 max-w-xl mx-auto mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari gym, lapangan, taman..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-card-dark border border-card-border text-text-light placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,127,0.08)] transition-all text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills (Rekomendasi Kategori BMI) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {CATEGORY_FILTER_OPTIONS.map((opt) => {
              const active = selectedCategory === opt.id;
              return (
                <button
                  key={opt.id || "all"}
                  onClick={() => {
                    setSelectedCategory(opt.id);
                    setSelectedLocation(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? "bg-primary text-background-dark border-primary shadow-[0_0_14px_rgba(0,255,127,0.3)]"
                      : "bg-card-dark/80 text-text-muted border-card-border hover:text-text-light hover:border-primary/30"
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.id && (
                    <span
                      className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md ${
                        active
                          ? "bg-background-dark/20 text-background-dark font-black"
                          : "bg-background-base text-text-muted"
                      }`}
                    >
                      {opt.bmiNote.replace("Rekomendasi ", "")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* View toggle + Add button */}
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex bg-card-dark border border-card-border rounded-2xl p-1">
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === "map"
                  ? "bg-primary text-background-dark shadow-[0_0_12px_rgba(0,255,127,0.3)]"
                  : "text-text-muted hover:text-primary"
                  }`}
              >
                <MapIcon size={13} />
                Peta
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === "list"
                  ? "bg-primary text-background-dark shadow-[0_0_12px_rgba(0,255,127,0.3)]"
                  : "text-text-muted hover:text-primary"
                  }`}
              >
                <List size={13} />
                Daftar
              </button>
            </div>
          </div>
        </div>
      </section>



      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-text-muted text-sm">Memuat lokasi...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-text-light">
                  Rekomendasi Tempat Olahraga
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  {userPosition
                    ? "Diurutkan berdasarkan jarak terdekat dari lokasi Anda"
                    : "Tempat olahraga yang direkomendasikan komunitas"}
                </p>
              </div>
              <span className="text-text-muted text-sm font-semibold">
                {sortedLocations.length} lokasi
              </span>
            </div>

            {sortedLocations.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <MapPin size={28} className="text-primary" />
                </div>
                <p className="text-text-light font-bold text-lg mb-2">
                  Belum ada lokasi
                </p>
                <p className="text-text-muted text-sm mb-4">
                  {debouncedSearch
                    ? "Tidak ada lokasi yang cocok dengan pencarian."
                    : "Jadilah yang pertama menambahkan rekomendasi tempat olahraga!"}
                </p>
                {debouncedSearch && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-primary text-sm font-semibold hover:underline"
                  >
                    Reset pencarian
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Map View */}
                {viewMode === "map" && (
                  <div className="mb-8" ref={mapSectionRef}>
                    <div className="bg-card-dark border border-card-border rounded-3xl overflow-hidden shadow-2xl">
                      <div className="h-[450px] md:h-[550px]">
                        <MapView
                          locations={sortedLocations}
                          userPosition={userPosition}
                          selectedLocation={selectedLocation}
                          onSelectLocation={setSelectedLocation}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sortedLocations.map((loc) => {
                    const distance =
                      userPosition && loc.latitude && loc.longitude
                        ? getDistance(
                          userPosition[0],
                          userPosition[1],
                          loc.latitude,
                          loc.longitude,
                        )
                        : null;

                    return (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocation(loc);
                          if (viewMode === "list") setViewMode("map");
                          setTimeout(() => {
                            mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 100);
                        }}
                        className={`group text-left bg-card-dark border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,255,127,0.06)] ${selectedLocation?.id === loc.id
                          ? "border-primary/50 shadow-[0_0_24px_rgba(0,255,127,0.1)]"
                          : "border-card-border hover:border-primary/20"
                          }`}
                      >
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${selectedLocation?.id === loc.id
                              ? "bg-primary/20 border border-primary/30"
                              : "bg-primary/10 border border-primary/15"
                              }`}
                          >
                            <MapPin
                              size={18}
                              className={`${selectedLocation?.id === loc.id
                                ? "text-primary"
                                : "text-primary/70"
                                }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  CATEGORY_CARD_BADGE[loc.category || "lapangan"]
                                    ?.className ||
                                  CATEGORY_CARD_BADGE.lapangan.className
                                }`}
                              >
                                {CATEGORY_CARD_BADGE[loc.category || "lapangan"]
                                  ?.label ||
                                  CATEGORY_CARD_BADGE.lapangan.label}
                              </span>
                              <span className="text-[10px] text-text-muted font-semibold">
                                • BMI:{" "}
                                {CATEGORY_CARD_BADGE[loc.category || "lapangan"]
                                  ?.bmiLabel || "Normal"}
                              </span>
                            </div>
                            <h3 className="font-black text-text-light text-base leading-snug group-hover:text-primary transition-colors line-clamp-1">
                              {loc.name}
                            </h3>
                            {loc.address && (
                              <p className="text-text-muted text-xs mt-0.5 line-clamp-1">
                                {loc.address}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-card-border">
                          <div className="flex items-center gap-3">
                            {distance !== null && (
                              <span className="flex items-center gap-1 text-xs text-text-muted">
                                <Navigation
                                  size={11}
                                  className="text-primary/70"
                                />
                                {distance < 1
                                  ? `${Math.round(distance * 1000)} m`
                                  : `${distance.toFixed(1)} km`}
                              </span>
                            )}
                            {loc.account?.name && (
                              <span className="text-[10px] text-text-muted">
                                oleh {loc.account.name}
                              </span>
                            )}
                          </div>
                          <ChevronDown
                            size={14}
                            className="text-primary opacity-0 group-hover:opacity-100 transition-all -rotate-90"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
