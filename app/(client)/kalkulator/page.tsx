"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  SlidersHorizontal,
  BarChart2,
  Lightbulb,
  Utensils,
  ArrowRight,
  Flame,
  Clock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Scale,
  Sparkles,
  Zap,
  Activity,
  MapPin,
  Navigation,
  Dumbbell,
  HeartPulse,
} from "lucide-react";
import BMIRiwayatChart, {
  PerhitunganItem,
} from "@/components/client/BMIRiwayatChart";
import { hitungAnalisisKesehatan } from "@/lib/kesehatan";

const MapView = dynamic(() => import("@/components/client/LokasiMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-card-dark rounded-2xl border border-card-border">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  ),
});

type TargetStatus = "Kurus" | "Normal" | "Berlebih" | "Obesitas";

type BMIResult = {
  bmi: number;
  status: TargetStatus;
  bmr: number;
  tdee: number;
  berat_min: number;
  berat_max: number;
  protein: number;
  lemak: number;
  karbohidrat: number;
  tinggi_badan?: number;
  berat_badan?: number;
};

type Menu = {
  id: number;
  nama_menu: string;
  slug: string;
  kalori: number;
  waktu_memasak: number;
  gambar: string;
  target_status: TargetStatus;
};

type LokasiOlahragaItem = {
  id: number;
  name: string;
  category?: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at?: string | null;
  account?: { name: string | null };
};

const SPORTS_RECOMMENDATION_CONFIG: Record<
  TargetStatus,
  {
    category: "gym" | "lapangan" | "low_impact";
    title: string;
    facilityBadge: string;
    bmiBadge: string;
    desc: string;
    activities: string[];
  }
> = {
  Kurus: {
    category: "gym",
    title: "Rekomendasi Fitness Center & Gym",
    facilityBadge: "🏋️ Fitness Center / Gym",
    bmiBadge: "Underweight (Kurus)",
    desc: "Untuk kategori Underweight, disarankan fokus pada latihan beban (resistance/strength training) guna membangun massa otot secara optimal.",
    activities: ["Weight Training", "Resistance Machine", "Bodyweight Strength"],
  },
  Normal: {
    category: "lapangan",
    title: "Rekomendasi Lapangan & Komunitas Olahraga",
    facilityBadge: "🏟️ Lapangan / Komunitas",
    bmiBadge: "Normal (Ideal)",
    desc: "Untuk kategori Normal, pertahankan kebugaran kardiovaskular dan kelincahan tubuh melalui olahraga permainan atau komunitas lari/olahraga terbuka.",
    activities: ["Futsal / Sepak Bola", "Badminton / Basket", "Komunitas Lari"],
  },
  Berlebih: {
    category: "low_impact",
    title: "Rekomendasi Fasilitas Low-Impact (Jogging & Kolam Renang)",
    facilityBadge: "🏊 Fasilitas Low-Impact",
    bmiBadge: "Overweight (Berlebih)",
    desc: "Untuk kategori Overweight, pilih fasilitas olahraga low-impact seperti jalur jogging atau kolam renang untuk membakar kalori tanpa membebani persendian.",
    activities: ["Berenang", "Jalan Cepat / Jogging Track", "Sepeda Statis"],
  },
  Obesitas: {
    category: "low_impact",
    title: "Rekomendasi Fasilitas Low-Impact (Jogging & Kolam Renang)",
    facilityBadge: "🏊 Fasilitas Low-Impact",
    bmiBadge: "Obesitas",
    desc: "Untuk kategori Obesitas, sangat dianjurkan memulai aktivitas fisik di fasilitas ramah sendi seperti kolam renang atau jalan santai di taman terbuka.",
    activities: ["Berenang / Akuatik", "Jalan Santai di Taman", "Stretching & Yoga"],
  },
};

function getDistanceKm(
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

const AKTIVITAS_OPTIONS = [
  {
    id: "rebahan",
    label: "Sedentary",
    desc: "Jarang / tidak pernah olahraga (faktor 1.2)",
  },
  { id: "ringan", label: "Ringan", desc: "Olahraga 1–3 hari/minggu (faktor 1.375)" },
  { id: "sedang", label: "Moderat", desc: "Olahraga 3–5 hari/minggu (faktor 1.55)" },
  { id: "berat", label: "Aktif", desc: "Olahraga 6–7 hari/minggu (faktor 1.725)" },
] as const;

const STATUS_CONFIG: Record<
  TargetStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    textColor: string;
    icon: React.ReactNode;
    desc: string;
    range: string;
  }
> = {
  Kurus: {
    label: "Kekurangan Berat",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    textColor: "text-amber-500 dark:text-amber-400",
    icon: <AlertTriangle size={20} className="text-amber-500 dark:text-amber-400" />,
    desc: "Perlu menambah asupan kalori bernutrisi dan latihan beban secara rutin.",
    range: "BMI < 18.5",
  },
  Normal: {
    label: "Normal (Ideal)",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    textColor: "text-emerald-500 dark:text-emerald-400",
    icon: <CheckCircle size={20} className="text-emerald-500 dark:text-emerald-400" />,
    desc: "Pertahankan pola makan seimbang dan rutinitas aktivitas fisik saat ini.",
    range: "BMI 18.5 – 24.9",
  },
  Berlebih: {
    label: "Kelebihan Berat",
    color: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    textColor: "text-orange-500 dark:text-orange-400",
    icon: <AlertCircle size={20} className="text-orange-500 dark:text-orange-400" />,
    desc: "Disarankan defisit kalori terukur dan olahraga kardio konsisten.",
    range: "BMI 25.0 – 29.9",
  },
  Obesitas: {
    label: "Obesitas",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    textColor: "text-rose-500 dark:text-rose-400",
    icon: <AlertCircle size={20} className="text-rose-500 dark:text-rose-400" />,
    desc: "Konsultasikan dengan dokter dan mulai program penurunan berat badan terstruktur.",
    range: "BMI ≥ 30",
  },
};

const TIPS: Record<TargetStatus, string[]> = {
  Kurus: [
    "Makan 5–6 kali sehari dengan porsi kecil namun padat kalori sehat.",
    "Tingkatkan asupan protein berkualitas seperti dada ayam, telur, tempe, dan tahu.",
    "Lakukan latihan beban 3–4x seminggu untuk memicu hipertrofi otot.",
  ],
  Normal: [
    "Lakukan aktivitas fisik moderat minimal 150 menit per minggu.",
    "Pastikan kecukupan cairan tubuh minimal 2 liter air mineral per hari.",
    "Perbanyak porsi sayuran hijau dan buah segar di setiap jam makan utama.",
  ],
  Berlebih: [
    "Batasi konsumsi gula tambahan, gorengan, dan minuman manis kemasan.",
    "Lakukan kardio low-impact seperti jalan cepat atau sepeda 30 menit per hari.",
    "Gunakan piring berukuran lebih kecil untuk mengontrol porsi makan secara alami.",
  ],
  Obesitas: [
    "Konsultasikan kondisi klinis Anda dengan dokter atau ahli gizi teregistrasi.",
    "Awali dengan target ringan: jalan santai 15–20 menit setiap pagi atau sore.",
    "Fokus pada makanan utuh (whole foods) dan hindari makanan ultra-proses (UPF).",
  ],
};

const ALL_STATUSES: TargetStatus[] = [
  "Kurus",
  "Normal",
  "Berlebih",
  "Obesitas",
];

export default function KalkulatorBMIPage() {
  const [gender, setGender] = useState<"pria" | "wanita">("pria");
  const [tinggi, setTinggi] = useState(170);
  const [berat, setBerat] = useState(65);
  const [usia, setUsia] = useState(25);
  const [aktivitas, setAktivitas] = useState<
    "rebahan" | "ringan" | "sedang" | "berat"
  >("sedang");
  const [result, setResult] = useState<BMIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [history, setHistory] = useState<PerhitunganItem[]>([]);
  const [mealTab, setMealTab] = useState<
    "semua" | "sarapan" | "siang" | "malam"
  >("semua");
  const [sportsLocations, setSportsLocations] = useState<LokasiOlahragaItem[]>(
    [],
  );
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LokasiOlahragaItem | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null,
  );

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/perhitungan");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch calculation history:", err);
    }
  };

  const fetchRecommendedLocations = useCallback(
    async (statusTarget: TargetStatus) => {
      setLoadingLocations(true);
      try {
        const res = await fetch(
          `/api/lokasi-olahraga?target=${encodeURIComponent(statusTarget)}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data: LokasiOlahragaItem[] = await res.json();
          setSportsLocations(data);
          setSelectedLocation(null);
        }
      } catch (err) {
        console.error("Failed to fetch sports locations:", err);
      } finally {
        setLoadingLocations(false);
      }
    },
    [],
  );

  const fetchRecommendedMenus = useCallback(
    async (statusTarget: TargetStatus) => {
      setLoadingMenus(true);
      try {
        const res = await fetch(
          `/api/menus?target=${encodeURIComponent(statusTarget)}`,
        );
        if (res.ok) {
          const menuData: Menu[] = await res.json();
          setMenus(menuData.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to fetch recommended menus:", err);
      } finally {
        setLoadingMenus(false);
      }
    },
    [],
  );

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          setUserPosition([-6.326, 108.32]);
        },
      );
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        setIsLoggedIn(r.ok);
        if (r.ok) {
          fetchHistory();
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  // Hitung preview real-time secara instan dari parameter slider saat ini
  const preview = hitungAnalisisKesehatan({
    tinggi,
    berat,
    gender,
    usia,
    aktivitas,
  });
  const previewBMI = parseFloat(preview.bmi.toFixed(1));
  const previewStatus: TargetStatus = preview.status;

  // Jika parameter diubah setelah menekan tombol hitung, kembalikan status ke pratinjau langsung
  useEffect(() => {
    if (result) {
      if (
        result.tinggi_badan !== tinggi ||
        result.berat_badan !== berat ||
        result.gender !== gender ||
        result.usia !== usia ||
        result.aktivitas !== aktivitas
      ) {
        setResult(null);
      }
    }
  }, [tinggi, berat, gender, usia, aktivitas, result]);

  // Muat lokasi olahraga dan menu diet sesuai status terkini secara otomatis (termasuk saat pertama buka)
  useEffect(() => {
    fetchRecommendedLocations(previewStatus);
    fetchRecommendedMenus(previewStatus);
  }, [previewStatus, fetchRecommendedLocations, fetchRecommendedMenus]);

  const handleHitung = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/perhitungan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tinggi_badan: tinggi,
          berat_badan: berat,
          gender,
          usia,
          aktivitas,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (isLoggedIn) {
          fetchHistory();
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayStatus = previewStatus;
  const statusCfg = STATUS_CONFIG[currentDisplayStatus];
  const displayedBMI = previewBMI.toFixed(1);

  // Kalkulasi posisi jarum BMI pada meter bar (range 15 s.d. 35)
  const bmiNumeric = parseFloat(displayedBMI);
  const gaugePercent = Math.min(
    100,
    Math.max(0, ((bmiNumeric - 15) / (35 - 15)) * 100),
  );

  return (
    <div className="min-h-screen bg-background-base">
      {/* ── 1. Hero Header ── */}
      <section className="relative bg-background-base pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-card-border/60 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-card-border text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide mb-4">
            <HeartPulse size={14} className="text-primary" />
            <span>Kalkulator Komposisi Tubuh & Gizi Klinis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-light tracking-tight mb-3">
            Analisis BMI, BMR & Target Kalori
          </h1>
          <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Hitung indeks massa tubuh Anda secara saintifik, ketahui kebutuhan kalori
            harian (TDEE), serta temukan rencana menu dan olahraga yang sesuai.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* ── 2. Main Calculator Grid (Form Parameter & Hasil Analisis) ── */}
        <div className="grid lg:grid-cols-12 gap-6 mb-10">
          {/* Sisi Kiri: Parameter Fisik (Input Form) */}
          <div className="lg:col-span-6 bg-card-dark border border-card-border rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-card-border/60">
                <h2 className="text-base font-bold text-text-light flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary" />
                  Parameter Fisik Anda
                </h2>
                <span className="text-xs text-text-muted font-medium">Langkah 1 dari 2</span>
              </div>

              {/* Gender */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-text-muted mb-2">
                  Pilih Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["pria", "wanita"] as const).map((g) => {
                    const isSelected = gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                            : "border-card-border bg-background-base/60 text-text-muted hover:border-primary/40 hover:text-text-light"
                        }`}
                      >
                        <span className="text-base">{g === "pria" ? "♂" : "♀"}</span>
                        <span className="capitalize">{g === "pria" ? "Pria" : "Wanita"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tinggi Badan */}
              <div className="mb-5 bg-background-base/50 p-4 rounded-2xl border border-card-border/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-muted">Tinggi Badan</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-text-light">{tinggi}</span>
                    <span className="text-xs text-text-muted font-bold">cm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={100}
                  max={220}
                  value={tinggi}
                  onChange={(e) => setTinggi(Number(e.target.value))}
                  className="w-full h-2 rounded-full accent-emerald-500 bg-card-border cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-text-muted/60 mt-1.5 font-medium">
                  <span>100 cm</span>
                  <span>160 cm</span>
                  <span>220 cm</span>
                </div>
              </div>

              {/* Berat Badan */}
              <div className="mb-5 bg-background-base/50 p-4 rounded-2xl border border-card-border/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-muted">Berat Badan</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-text-light">{berat}</span>
                    <span className="text-xs text-text-muted font-bold">kg</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={30}
                  max={200}
                  value={berat}
                  onChange={(e) => setBerat(Number(e.target.value))}
                  className="w-full h-2 rounded-full accent-emerald-500 bg-card-border cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-text-muted/60 mt-1.5 font-medium">
                  <span>30 kg</span>
                  <span>115 kg</span>
                  <span>200 kg</span>
                </div>
              </div>

              {/* Usia */}
              <div className="mb-5 bg-background-base/50 p-4 rounded-2xl border border-card-border/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-muted">Usia Saat Ini</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-text-light">{usia}</span>
                    <span className="text-xs text-text-muted font-bold">tahun</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={15}
                  max={90}
                  value={usia}
                  onChange={(e) => setUsia(Number(e.target.value))}
                  className="w-full h-2 rounded-full accent-emerald-500 bg-card-border cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-text-muted/60 mt-1.5 font-medium">
                  <span>15 th</span>
                  <span>50 th</span>
                  <span>90 th</span>
                </div>
              </div>

              {/* Tingkat Aktivitas Harian */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-text-muted mb-2">
                  Tingkat Aktivitas Harian
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AKTIVITAS_OPTIONS.map((opt) => {
                    const isSelected = aktivitas === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAktivitas(opt.id as typeof aktivitas)}
                        className={`flex flex-col text-left p-3 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                            : "border-card-border bg-background-base/50 text-text-muted hover:border-primary/40 hover:text-text-light"
                        }`}
                      >
                        <span className="font-bold text-text-light">{opt.label}</span>
                        <span className="text-[10px] opacity-75 leading-tight mt-0.5">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hitung Button */}
            <button
              type="button"
              onClick={handleHitung}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-sm sm:text-base py-3.5 rounded-xl transition shadow-xs disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Menganalisis Komposisi Tubuh...</span>
                </>
              ) : (
                <>
                  <BarChart2 size={18} />
                  <span>Hitung Analisis Lengkap Saya</span>
                </>
              )}
            </button>
          </div>

          {/* Sisi Kanan: Hasil Analisis Kesehatan & Nutrisi */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Kartu Utama Hasil */}
            <div className="bg-card-dark border border-card-border rounded-3xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-card-border/60">
                <h2 className="text-base font-bold text-text-light flex items-center gap-2">
                  <Activity size={18} className="text-primary" />
                  Hasil Analisis Kesehatan
                </h2>
                <span className="text-xs">
                  {result ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle size={12} /> Data Tersimpan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-text-muted bg-secondary/60 px-2.5 py-0.5 rounded-md border border-card-border font-medium">
                      Pratinjau Langsung
                    </span>
                  )}
                </span>
              </div>

              {/* Status Header with BMI Score & WHO Badge */}
              <div className="bg-background-base/60 border border-card-border rounded-2xl p-5 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
                      Indeks Massa Tubuh (BMI)
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-extrabold text-text-light tracking-tight">
                        {displayedBMI}
                      </span>
                      <span className="text-xs text-text-muted">kg/m²</span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                    >
                      {statusCfg.icon}
                      <span>{statusCfg.label}</span>
                    </span>
                    <p className="text-[11px] text-text-muted mt-1.5">
                      Tinggi: <strong className="text-text-light">{tinggi} cm</strong> • Berat:{" "}
                      <strong className="text-text-light">{berat} kg</strong>
                    </p>
                  </div>
                </div>

                {/* Visual BMI Meter Bar */}
                <div className="mt-5 pt-4 border-t border-card-border/60">
                  <div className="flex justify-between text-[10px] font-bold text-text-muted mb-1.5">
                    <span>Kurus (&lt;18.5)</span>
                    <span>Ideal (18.5–24.9)</span>
                    <span>Berlebih (25–29.9)</span>
                    <span>Obesitas (≥30)</span>
                  </div>

                  <div className="relative w-full h-3 rounded-full overflow-hidden flex bg-card-border">
                    <div className="w-[17.5%] bg-amber-400" title="Kurus" />
                    <div className="w-[32%] bg-emerald-500" title="Normal / Ideal" />
                    <div className="w-[25%] bg-orange-400" title="Berlebih" />
                    <div className="w-[25.5%] bg-rose-500" title="Obesitas" />
                  </div>

                  {/* Marker Pin */}
                  <div className="relative w-full h-4 mt-1">
                    <div
                      className="absolute -top-1 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                      style={{ left: `${gaugePercent}%` }}
                    >
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-text-light" />
                      <span className="text-[9px] font-black text-text-light bg-card-dark px-1.5 py-0.2 rounded border border-card-border mt-0.5">
                        {displayedBMI}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Health Indicator Cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* 1. Berat Ideal Range */}
                <div className="bg-background-base/40 border border-card-border rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                    <Scale size={13} className="text-primary" /> Berat Badan Ideal
                  </span>
                  <p className="text-base font-extrabold text-text-light mt-1">
                    {preview.berat_min.toFixed(1)} – {preview.berat_max.toFixed(1)} kg
                  </p>
                  <span className="text-[10px] text-text-muted mt-0.5 block">
                    Standar WHO (BMI 18.5–24.9)
                  </span>
                </div>

                {/* 2. BMR */}
                <div className="bg-background-base/40 border border-card-border rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                    <Flame size={13} className="text-amber-500" /> Metabolisme Basal (BMR)
                  </span>
                  <p className="text-base font-extrabold text-text-light mt-1">
                    {Math.round(preview.bmr)} kkal
                  </p>
                  <span className="text-[10px] text-text-muted mt-0.5 block">
                    Energi minimal saat istirahat
                  </span>
                </div>

                {/* 3. TDEE (Kebutuhan Kalori) */}
                <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Zap size={14} /> Total Kebutuhan Energi Harian (TDEE)
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {Math.round(preview.tdee)} kkal / hari
                    </p>
                    <span className="text-[10px] text-text-muted mt-0.5 block">
                      Kalori yang dibakar tubuh termasuk aktivitas fisik
                    </span>
                  </div>
                </div>
              </div>

              {/* Makronutrisi Section */}
              <div className="bg-background-base/40 border border-card-border rounded-2xl p-4">
                <span className="text-xs font-bold text-text-light mb-3 flex items-center gap-1.5">
                  <Utensils size={14} className="text-primary" /> Rekomendasi Takaran Makronutrisi
                </span>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-card-dark p-2.5 rounded-xl border border-card-border">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">
                      Protein
                    </span>
                    <p className="text-base font-black text-text-light mt-0.5">
                      {Math.round(preview.protein)}g
                    </p>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      1.4g / kg BB
                    </span>
                  </div>
                  <div className="bg-card-dark p-2.5 rounded-xl border border-card-border">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">
                      Lemak Sehat
                    </span>
                    <p className="text-base font-black text-text-light mt-0.5">
                      {Math.round(preview.lemak)}g
                    </p>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 block mt-0.5">
                      30% Kalori
                    </span>
                  </div>
                  <div className="bg-card-dark p-2.5 rounded-xl border border-card-border">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">
                      Karbohidrat
                    </span>
                    <p className="text-base font-black text-text-light mt-0.5">
                      {Math.round(preview.karbohidrat)}g
                    </p>
                    <span className="text-[9px] text-teal-600 dark:text-teal-400 block mt-0.5">
                      Sisa Kalori
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-card-dark border border-card-border rounded-3xl p-5 sm:p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-3">
                <Lightbulb size={15} /> Tips Praktis: Kategori {currentDisplayStatus}
              </h3>
              <ul className="space-y-2">
                {TIPS[currentDisplayStatus].map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-text-muted leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── 3. Riwayat & Progress Chart / Guest Callout ── */}
        {isLoggedIn ? (
          <BMIRiwayatChart
            history={history}
            onRefreshHistory={fetchHistory}
            isLoggedIn={isLoggedIn}
          />
        ) : (
          <div className="bg-card-dark border border-card-border rounded-3xl p-6 sm:p-7 mb-10 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="font-bold text-text-light text-sm sm:text-base mb-0.5">
                  Simpan Riwayat & Pantau Tren Berat Badan
                </h3>
                <p className="text-text-muted text-xs sm:text-sm max-w-lg leading-relaxed">
                  Masuk atau buat akun FitLife gratis untuk merekam setiap hasil
                  perhitungan, grafik evolusi BMI, dan ekspor riwayat ke PDF.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="shrink-0 bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition shadow-xs"
            >
              Masuk / Daftar Akun
            </Link>
          </div>
        )}

        {/* ── 4. Panduan Standar Kategori BMI (WHO) ── */}
        <div className="mb-12">
          <div className="mb-4">
            <h3 className="text-base font-bold text-text-light">
              Klasifikasi Indeks Massa Tubuh (Standar WHO)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Rentang acuan medis untuk menentukan status berat badan orang dewasa.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const isSelected = currentDisplayStatus === s;
              return (
                <div
                  key={s}
                  className={`bg-card-dark border rounded-2xl p-4 sm:p-5 transition-all ${
                    isSelected
                      ? `${cfg.border} ring-1 ${cfg.border} shadow-xs`
                      : "border-card-border"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cfg.bg} border ${cfg.border}`}
                  >
                    {cfg.icon}
                  </div>
                  <h4 className="font-bold text-text-light text-sm mb-1">{cfg.label}</h4>
                  <p className={`text-xs font-bold mb-1.5 ${cfg.textColor}`}>{cfg.range}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{cfg.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 5. Rekomendasi Menu Diet Berdasarkan Kategori BMI ── */}
        {(() => {
          const targetTotal = Math.round(preview.tdee);
          const sarapanKkal = Math.round(targetTotal * 0.25);
          const siangKkal = Math.round(targetTotal * 0.4);
          const malamKkal = Math.round(targetTotal * 0.35);

          const filteredMenus = menus.filter((item) => {
            if (mealTab === "sarapan") return item.kalori <= sarapanKkal + 150;
            if (mealTab === "siang")
              return item.kalori >= 300 && item.kalori <= siangKkal + 200;
            if (mealTab === "malam") return item.kalori <= malamKkal + 150;
            return true;
          });

          return (
            <div className="pt-8 border-t border-card-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-text-light flex items-center gap-2">
                    <Utensils size={18} className="text-primary" />
                    Rekomendasi Menu Diet: {currentDisplayStatus}
                  </h3>
                  <p className="text-text-muted text-xs sm:text-sm mt-0.5">
                    Target harian Anda:{" "}
                    <strong className="text-text-light">{targetTotal} kkal / hari</strong>
                  </p>
                </div>
                <Link
                  href="/menu"
                  className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 transition"
                >
                  <span>Lihat Semua Katalog Menu</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Meal Plan Breakdown Banner */}
              <div className="grid grid-cols-3 gap-3 mb-5 bg-card-dark border border-card-border p-3.5 rounded-2xl">
                <div className="text-center p-2 rounded-xl bg-background-base/60">
                  <span className="text-[11px] font-semibold text-text-muted block">
                    🌅 Sarapan (25%)
                  </span>
                  <span className="text-sm font-extrabold text-text-light mt-0.5 block">
                    ~{sarapanKkal} kkal
                  </span>
                </div>
                <div className="text-center p-2 rounded-xl bg-background-base/60">
                  <span className="text-[11px] font-semibold text-text-muted block">
                    ☀️ Siang (40%)
                  </span>
                  <span className="text-sm font-extrabold text-text-light mt-0.5 block">
                    ~{siangKkal} kkal
                  </span>
                </div>
                <div className="text-center p-2 rounded-xl bg-background-base/60">
                  <span className="text-[11px] font-semibold text-text-muted block">
                    🌙 Malam (35%)
                  </span>
                  <span className="text-sm font-extrabold text-text-light mt-0.5 block">
                    ~{malamKkal} kkal
                  </span>
                </div>
              </div>

              {/* Meal Plan Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
                {[
                  { id: "semua", label: "Semua Rekomendasi" },
                  { id: "sarapan", label: `🌅 Sarapan (~${sarapanKkal} kkal)` },
                  { id: "siang", label: `☀️ Makan Siang (~${siangKkal} kkal)` },
                  { id: "malam", label: `🌙 Makan Malam (~${malamKkal} kkal)` },
                ].map((tab) => {
                  const isTabActive = mealTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMealTab(tab.id as typeof mealTab)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        isTabActive
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "bg-card-dark text-text-muted border border-card-border hover:text-text-light hover:bg-secondary/40"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {loadingMenus ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : filteredMenus.length === 0 ? (
                <div className="text-center py-10 text-text-muted text-xs sm:text-sm bg-card-dark/40 border border-card-border rounded-2xl">
                  Belum ada menu yang cocok untuk filter waktu makan ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMenus.map((item) => {
                    const pct = Math.round((item.kalori / targetTotal) * 100);
                    return (
                      <Link key={item.id} href={`/menu/${item.slug}`}>
                        <div className="group bg-card-dark border border-card-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all hover:-translate-y-0.5 shadow-xs flex flex-col h-full">
                          <div className="relative h-44 overflow-hidden">
                            <Image
                              src={item.gambar}
                              alt={item.nama_menu}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-card-dark/80 via-transparent to-transparent" />
                            <span className="absolute bottom-3 left-3 bg-card-dark/90 border border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-xs">
                              {pct}% Target Harian
                            </span>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <h4 className="font-bold text-text-light text-sm mb-2 group-hover:text-primary transition-colors line-clamp-1">
                              {item.nama_menu}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-card-border/60">
                              <span className="flex items-center gap-1 font-semibold text-amber-500">
                                <Flame size={12} /> {item.kalori} kkal
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} className="text-primary/70" /> {item.waktu_memasak}m
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── 6. Peta & Rekomendasi Lokasi Olahraga ── */}
        {(() => {
          const sportCfg = SPORTS_RECOMMENDATION_CONFIG[currentDisplayStatus];
          const sortedSportsLocations = [...sportsLocations].sort((a, b) => {
            if (!userPosition || a.latitude == null || b.latitude == null) return 0;
            const distA = getDistanceKm(
              userPosition[0],
              userPosition[1],
              a.latitude,
              a.longitude!,
            );
            const distB = getDistanceKm(
              userPosition[0],
              userPosition[1],
              b.latitude,
              b.longitude!,
            );
            return distA - distB;
          });

          return (
            <div className="mt-12 pt-8 border-t border-card-border/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-primary text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Dumbbell size={12} />
                    <span>{sportCfg.facilityBadge} • Kategori {sportCfg.bmiBadge}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-text-light flex items-center gap-2">
                    <MapPin size={20} className="text-primary shrink-0" />
                    <span>{sportCfg.title}</span>
                  </h3>
                  <p className="text-text-muted text-xs sm:text-sm mt-0.5 max-w-2xl leading-relaxed">
                    {sportCfg.desc}
                  </p>
                </div>
                <Link
                  href={`/lokasi?target=${currentDisplayStatus}`}
                  className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 transition whitespace-nowrap"
                >
                  <span>Lihat Semua Lokasi</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Rekomendasi Aktivitas */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="text-xs font-semibold text-text-muted mr-1">
                  Fokus Olahraga:
                </span>
                {sportCfg.activities.map((act) => (
                  <span
                    key={act}
                    className="px-2.5 py-1 rounded-lg bg-card-dark border border-card-border text-text-light text-xs font-medium"
                  >
                    ✓ {act}
                  </span>
                ))}
              </div>

              {loadingLocations ? (
                <div className="flex items-center justify-center py-16 bg-card-dark border border-card-border rounded-3xl">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs text-text-muted">
                      Memuat peta rekomendasi fasilitas olahraga...
                    </span>
                  </div>
                </div>
              ) : sortedSportsLocations.length === 0 ? (
                <div className="text-center py-10 text-text-muted text-xs sm:text-sm bg-card-dark/40 border border-card-border rounded-2xl">
                  Belum ada fasilitas olahraga yang terdaftar untuk kategori ini.{" "}
                  <Link href="/lokasi" className="text-primary font-bold hover:underline ml-1">
                    Buka Peta Utama →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Peta Interaktif Leaflet */}
                  <div className="lg:col-span-7 bg-card-dark border border-card-border rounded-3xl overflow-hidden shadow-xs">
                    <div className="h-[360px] sm:h-[400px]">
                      <MapView
                        locations={sortedSportsLocations}
                        userPosition={userPosition}
                        selectedLocation={selectedLocation}
                        onSelectLocation={setSelectedLocation}
                      />
                    </div>
                  </div>

                  {/* List Fasilitas Terdekat */}
                  <div className="lg:col-span-5 space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                        Fasilitas Terdekat ({sortedSportsLocations.length})
                      </span>
                      {userPosition && (
                        <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                          <Navigation size={11} /> Jarak dari Anda
                        </span>
                      )}
                    </div>
                    {sortedSportsLocations.map((loc) => {
                      const distance =
                        userPosition &&
                        loc.latitude != null &&
                        loc.longitude != null
                          ? getDistanceKm(
                              userPosition[0],
                              userPosition[1],
                              loc.latitude,
                              loc.longitude,
                            )
                          : null;
                      const isSel = selectedLocation?.id === loc.id;

                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => setSelectedLocation(loc)}
                          className={`w-full text-left bg-card-dark border rounded-2xl p-3.5 transition-all ${
                            isSel
                              ? "border-primary ring-1 ring-primary shadow-xs"
                              : "border-card-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                                isSel
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-primary"
                              }`}
                            >
                              <MapPin size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-text-light text-xs sm:text-sm truncate">
                                  {loc.name}
                                </h4>
                                {distance !== null && (
                                  <span className="shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-secondary text-primary text-[10px] font-bold">
                                    <Navigation size={9} />
                                    {distance < 1
                                      ? `${Math.round(distance * 1000)} m`
                                      : `${distance.toFixed(1)} km`}
                                  </span>
                                )}
                              </div>
                              {loc.address && (
                                <p className="text-text-muted text-[11px] mt-0.5 line-clamp-1">
                                  {loc.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
