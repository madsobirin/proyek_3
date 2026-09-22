"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SlidersHorizontal,
  BarChart2,
  Lightbulb,
  Utensils,
  ArrowRight,
  ChevronRight,
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
} from "lucide-react";
import BMIRiwayatChart, {
  PerhitunganItem,
} from "@/components/client/BMIRiwayatChart";
import { hitungAnalisisKesehatan } from "@/lib/kesehatan";

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

const AKTIVITAS_OPTIONS = [
  { id: "rebahan", label: "Sedentary", desc: "Jarang / tidak pernah olahraga (1.2)" },
  { id: "ringan", label: "Light", desc: "Olahraga 1–3 hari/minggu (1.375)" },
  { id: "sedang", label: "Moderate", desc: "Olahraga 3–5 hari/minggu (1.55)" },
  { id: "berat", label: "Active", desc: "Olahraga 6–7 hari/minggu (1.725)" },
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
    color: "text-yellow-300",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    textColor: "text-yellow-300",
    icon: <AlertTriangle size={20} className="text-yellow-400" />,
    desc: "Perlu menambah asupan kalori bernutrisi dan latihan beban secara rutin.",
    range: "BMI < 18.5",
  },
  Normal: {
    label: "Normal (Ideal)",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    textColor: "text-primary",
    icon: <CheckCircle size={20} className="text-primary" />,
    desc: "Pertahankan gaya hidup aktif dan pola makan seimbang.",
    range: "BMI 18.5 – 24.9",
  },
  Berlebih: {
    label: "Kelebihan Berat",
    color: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    textColor: "text-red-300",
    icon: <AlertCircle size={20} className="text-red-400" />,
    desc: "Disarankan untuk melakukan defisit kalori ringan dan olahraga kardio rutin.",
    range: "BMI 25.0 – 29.9",
  },
  Obesitas: {
    label: "Obesitas",
    color: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    textColor: "text-red-400",
    icon: <AlertCircle size={20} className="text-red-500" />,
    desc: "Konsultasikan dengan dokter dan mulai program penurunan berat badan terstruktur.",
    range: "BMI ≥ 30",
  },
};

const TIPS: Record<TargetStatus, string[]> = {
  Kurus: [
    "Makan 5–6 kali sehari dengan porsi kecil namun padat kalori.",
    "Konsumsi protein tinggi seperti telur, ayam, dan kacang-kacangan.",
    "Lakukan latihan beban 3x seminggu untuk massa otot.",
  ],
  Normal: [
    "Lakukan aktivitas fisik ringan minimal 30 menit sehari.",
    "Pastikan hidrasi tubuh tercukupi dengan minum air mineral 2L/hari.",
    "Konsumsi sayur dan buah setiap hari untuk nutrisi optimal.",
  ],
  Berlebih: [
    "Kurangi asupan gula dan makanan olahan.",
    "Olahraga kardio seperti jalan cepat atau bersepeda 30 menit/hari.",
    "Catat asupan kalori harian untuk memantau defisit kalori.",
  ],
  Obesitas: [
    "Konsultasi dengan dokter atau ahli gizi segera.",
    "Mulai dengan aktivitas ringan seperti jalan kaki 15 menit/hari.",
    "Hindari minuman manis dan makanan tinggi lemak jenuh.",
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
    "rebahan" | "ringan" | "sedang" | "berat" | "sangat_aktif"
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

  // Auto hitung preview menggunakan modul sentral lib/kesehatan
  const preview = hitungAnalisisKesehatan({
    tinggi,
    berat,
    gender,
    usia,
    aktivitas,
  });
  const previewBMI = parseFloat(preview.bmi.toFixed(1));
  const previewStatus: TargetStatus = preview.status;

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
        // Refresh history hanya jika user login
        if (isLoggedIn) {
          fetchHistory();
        }
        // Fetch menu rekomendasi
        setLoadingMenus(true);
        const menuRes = await fetch(`/api/menus?target=${data.status}`);
        if (menuRes.ok) {
          const menuData: Menu[] = await menuRes.json();
          setMenus(menuData.slice(0, 3));
        }
        setLoadingMenus(false);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const statusCfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div className="min-h-screen bg-background-base">

      {/* Hero */}
      <section className="relative bg-background-dark pt-14 pb-16 border-b border-card-border overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/4 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-black tracking-widest uppercase mb-5">
            <Scale size={11} /> Kalkulator BMI
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-text-light mb-3 leading-tight">
            Cek{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-green-300">
              BMI Anda
            </span>
          </h1>
          <p className="text-text-muted text-base max-w-lg mx-auto">
            Ketahui indeks massa tubuh dan dapatkan rekomendasi menu diet yang
            tepat untuk kondisi Anda.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* ── Main Calculator Grid ── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {/* Left — Input */}
          <div className="bg-card-dark border border-card-border rounded-3xl p-6 md:p-8">
            <h2 className="text-base font-black text-text-light flex items-center gap-2 mb-6">
              <SlidersHorizontal size={16} className="text-primary" />
              Parameter Fisik
            </h2>

            {/* Gender */}
            <div className="mb-6">
              <p className="text-sm font-bold text-text-muted mb-3">
                Pilih Jenis Kelamin
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["pria", "wanita"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                      gender === g
                        ? "border-primary bg-primary/10 text-primary shadow-[0_0_16px_rgba(0,255,127,0.15)]"
                        : "border-card-border bg-background-base/40 text-text-muted hover:border-primary/40 hover:text-text-light"
                    }`}
                  >
                    <span className="text-2xl">{g === "pria" ? "♂" : "♀"}</span>
                    <span className="capitalize">
                      {g === "pria" ? "Pria" : "Wanita"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tinggi */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-text-muted">
                  Tinggi Badan
                </p>
                <span className="text-2xl font-black text-primary">
                  {tinggi}{" "}
                  <span className="text-xs text-text-muted font-bold">CM</span>
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={220}
                value={tinggi}
                onChange={(e) => setTinggi(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) ${((tinggi - 100) / 120) * 100}%, rgba(255,255,255,0.1) ${((tinggi - 100) / 120) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-text-muted/50 mt-1.5 font-bold">
                <span>100 cm</span>
                <span>220 cm</span>
              </div>
            </div>

            {/* Berat Badan */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-text-muted">Berat Badan</p>
                <span className="text-2xl font-black text-primary">
                  {berat}{" "}
                  <span className="text-xs text-text-muted font-bold">KG</span>
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={200}
                value={berat}
                onChange={(e) => setBerat(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) ${((berat - 30) / 170) * 100}%, rgba(255,255,255,0.1) ${((berat - 30) / 170) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-text-muted/50 mt-1.5 font-bold">
                <span>30 kg</span>
                <span>200 kg</span>
              </div>
            </div>

            {/* Usia */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-text-muted">Usia</p>
                <span className="text-2xl font-black text-primary">
                  {usia}{" "}
                  <span className="text-xs text-text-muted font-bold">
                    Tahun
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={90}
                value={usia}
                onChange={(e) => setUsia(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) ${((usia - 15) / 75) * 100}%, rgba(255,255,255,0.1) ${((usia - 15) / 75) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-text-muted/50 mt-1.5 font-bold">
                <span>15 th</span>
                <span>90 th</span>
              </div>
            </div>

            {/* Tingkat Aktivitas Harian */}
            <div className="mb-8">
              <p className="text-sm font-bold text-text-muted mb-3">
                Tingkat Aktivitas Harian
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AKTIVITAS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAktivitas(opt.id as typeof aktivitas)}
                    className={`flex flex-col text-left p-3 rounded-2xl border text-xs transition-all ${
                      opt.id === "sangat_aktif" ? "col-span-2" : ""
                    } ${
                      aktivitas === opt.id
                        ? "border-primary bg-primary/10 text-primary font-black shadow-[0_0_14px_rgba(0,255,127,0.12)]"
                        : "border-card-border bg-background-base/40 text-text-muted hover:border-primary/40 hover:text-text-light"
                    }`}
                  >
                    <span className="font-bold text-text-light">
                      {opt.label}
                    </span>
                    <span className="text-[10px] opacity-70 leading-tight mt-0.5">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hitung Button */}
            <button
              onClick={handleHitung}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background-dark font-black text-base py-4 rounded-2xl transition-all shadow-[0_0_24px_rgba(0,255,127,0.4)] hover:shadow-[0_0_32px_rgba(0,255,127,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Menghitung...
                </>
              ) : (
                <>
                  <BarChart2 size={18} /> Hitung Analisis Kesehatan Saya
                </>
              )}
            </button>
          </div>

          {/* Right — Result */}
          <div className="flex flex-col gap-4">
            {/* Hasil */}
            <div className="bg-card-dark border border-card-border rounded-3xl p-6 md:p-8 flex-1">
              <h2 className="text-base font-black text-text-light flex items-center gap-2 mb-6">
                <Activity size={16} className="text-primary" />
                Hasil Analisis Kesehatan & Nutrisi
              </h2>

              {result ? (
                <div className="space-y-4">
                  {/* Status BMI Card */}
                  <div
                    className={`bg-background-base border ${statusCfg!.border} rounded-2xl p-5 text-center`}
                  >
                    <span
                      className={`inline-block px-5 py-1.5 rounded-full text-2xl font-black ${statusCfg!.bg} ${statusCfg!.color} border ${statusCfg!.border}`}
                    >
                      {result.status}
                    </span>
                    <div className="flex items-center justify-center gap-3 mt-3 text-xs font-bold text-text-muted">
                      <span>Tinggi: <strong className="text-text-light">{result.tinggi_badan ?? tinggi} cm</strong></span>
                      <span>•</span>
                      <span>Berat: <strong className="text-text-light">{result.berat_badan ?? berat} kg</strong></span>
                    </div>
                  </div>

                  {/* Grid Indikator Kesehatan Utama */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* BMI */}
                    <div className="bg-background-base/60 border border-card-border rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                        BMI
                      </span>
                      <span className="text-2xl font-black text-primary block my-1">
                        ≈ {result.bmi.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        Status: <strong className={statusCfg!.color}>{result.status}</strong>
                      </span>
                    </div>

                    {/* Kisaran berat berdasarkan BMI */}
                    <div className="bg-background-base/60 border border-card-border rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                        Kisaran berat berdasarkan BMI
                      </span>
                      <span className="text-xl font-black text-text-light block my-1">
                        ≈ {result.berat_min.toFixed(1)} – {result.berat_max.toFixed(1)} kg
                      </span>
                      <span className="text-[10px] text-text-muted">
                        Rentang berat normal (18.5 – 24.9)
                      </span>
                    </div>

                    {/* BMR */}
                    <div className="bg-background-base/60 border border-card-border rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block flex items-center gap-1">
                        <Flame size={12} className="text-orange-400" /> BMR
                      </span>
                      <span className="text-xl font-black text-text-light block my-1">
                        ≈ {Math.round(result.bmr)}{" "}
                        <span className="text-xs font-bold text-text-muted">
                          kcal/hari
                        </span>
                      </span>
                      <span className="text-[10px] text-text-muted">
                        Metabolisme basal saat istirahat
                      </span>
                    </div>

                    {/* Kebutuhan energi harian */}
                    <div className="bg-primary/10 border border-primary/30 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider block flex items-center gap-1">
                        <Zap size={12} className="text-primary" /> Kebutuhan energi harian
                      </span>
                      <span className="text-xl font-black text-primary block my-1">
                        ≈ {Math.round(result.tdee)}{" "}
                        <span className="text-xs font-bold text-primary/80">
                          kcal/hari
                        </span>
                      </span>
                      <span className="text-[10px] text-text-muted">
                        Total energi harian (TDEE)
                      </span>
                    </div>
                  </div>

                  {/* Makronutrien Section */}
                  <div className="bg-background-base/60 border border-card-border rounded-2xl p-4">
                    <p className="text-xs font-black text-text-light mb-3 flex items-center gap-1.5">
                      <Utensils size={14} className="text-primary" /> Rekomendasi Asupan Makronutrien
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {/* Protein */}
                      <div className="bg-card-dark/80 border border-card-border/80 rounded-xl p-2.5 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-black text-text-muted block">
                          Protein
                        </span>
                        <span className="text-base sm:text-lg font-black text-text-light block my-0.5">
                          ≈ {Math.round(result.protein)} <span className="text-[10px] font-bold text-text-muted">g/hari</span>
                        </span>
                        <span className="text-[9px] text-text-muted/70 block">
                          BB × 1.4 g
                        </span>
                      </div>

                      {/* Lemak */}
                      <div className="bg-card-dark/80 border border-card-border/80 rounded-xl p-2.5 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-black text-text-muted block">
                          Lemak
                        </span>
                        <span className="text-base sm:text-lg font-black text-text-light block my-0.5">
                          ≈ {Math.round(result.lemak)} <span className="text-[10px] font-bold text-text-muted">g/hari</span>
                        </span>
                        <span className="text-[9px] text-text-muted/70 block">
                          30% TDEE
                        </span>
                      </div>

                      {/* Karbohidrat */}
                      <div className="bg-card-dark/80 border border-card-border/80 rounded-xl p-2.5 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-black text-text-muted block">
                          Karbohidrat
                        </span>
                        <span className="text-base sm:text-lg font-black text-text-light block my-0.5">
                          ≈ {Math.round(result.karbohidrat)} <span className="text-[10px] font-bold text-text-muted">g/hari</span>
                        </span>
                        <span className="text-[9px] text-primary font-bold block">
                          sisa kalori
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-text-muted/80 text-center mt-2.5 italic">
                      * Karbohidrat dihitung dari sisa kalori
                    </p>
                  </div>

                  {/* Penjelasan Istilah Kalori (BMR & TDEE) */}
                  <div className="mt-4 bg-background-base/40 border border-card-border/60 rounded-2xl p-4 text-left space-y-2.5">
                    <p className="text-xs font-black text-text-light flex items-center gap-1.5 border-b border-card-border/40 pb-2">
                      <Lightbulb size={14} className="text-primary" /> Panduan
                      Istilah Kesehatan:
                    </p>
                    <div className="text-[11px] leading-relaxed text-text-muted space-y-1.5">
                      <p>
                        <strong className="text-text-light font-bold">
                          🔥 BMR (Basal Metabolic Rate):
                        </strong>{" "}
                        Energi minimal yang dibakar tubuh saat istirahat total
                        hanya untuk fungsi organ vital (jantung, bernapas, dan
                        otak).
                      </p>
                      <p>
                        <strong className="text-text-light font-bold">
                          ⚡ Kebutuhan Energi Harian (TDEE):
                        </strong>{" "}
                        Total kalori harian nyata yang Anda butuhkan setelah
                        memperhitungkan olahraga & aktivitas fisik harian.
                      </p>
                      <p>
                        <strong className="text-text-light font-bold">
                          ⚖️ Kisaran Berat Berdasarkan BMI:
                        </strong>{" "}
                        Rentang berat badan normal (BMI 18.5 – 24.9) yang direkomendasikan untuk tinggi badan Anda.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-block bg-background-base border border-card-border rounded-2xl px-6 py-5 mb-4 w-full">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-2xl font-black ${STATUS_CONFIG[previewStatus].bg} ${STATUS_CONFIG[previewStatus].color} border ${STATUS_CONFIG[previewStatus].border}`}
                    >
                      {previewStatus}
                    </span>
                    <p className="text-sm font-black text-primary mt-2">
                      BMI: ≈ {previewBMI}
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-text-muted mt-2">
                      <span>Tinggi: <strong className="text-text-light">{tinggi} cm</strong></span>
                      <span>Berat: <strong className="text-text-light">{berat} kg</strong></span>
                    </div>
                  </div>
                  <p className="text-text-muted text-sm">
                    Pilih usia & aktivitas harian lalu tekan tombol hitung untuk
                    melihat rincian BMR, kebutuhan energi harian, dan rekomendasi makronutrien lengkap Anda.
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-card-dark border border-card-border rounded-3xl p-6">
              <h3 className="text-sm font-black text-text-light flex items-center gap-2 mb-4">
                <Lightbulb size={15} className="text-primary" />
                Tips Cepat Sehat
              </h3>
              <ul className="space-y-2">
                {TIPS[result?.status ?? previewStatus].map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-text-muted"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Riwayat & Progress Chart / Guest Callout ── */}
        {isLoggedIn ? (
          <BMIRiwayatChart
            history={history}
            onRefreshHistory={fetchHistory}
            isLoggedIn={isLoggedIn}
          />
        ) : (
          <div className="bg-card-dark border border-card-border rounded-3xl p-6 sm:p-8 mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-text-light text-base mb-1">
                  Ingin Menyimpan Riwayat & Pantau Progres?
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Masuk atau buat akun gratis untuk mencatat setiap hasil hitungan, memantau grafik perubahan berat badan, dan target kalori harian Anda.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="flex-shrink-0 inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-background-dark font-black px-6 py-3 rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(0,255,127,0.3)] hover:shadow-[0_0_30px_rgba(0,255,127,0.5)]"
            >
              Masuk / Daftar
            </Link>
          </div>
        )}

        {/* ── Kategori BMI ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = (result?.status ?? previewStatus) === s;
            return (
              <div
                key={s}
                className={`bg-card-dark border rounded-2xl p-5 transition-all ${
                  isActive
                    ? `${cfg.border} shadow-[0_0_20px_rgba(0,255,127,0.08)]`
                    : "border-card-border"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cfg.bg} border ${cfg.border}`}
                >
                  {cfg.icon}
                </div>
                <h3 className="font-black text-text-light text-sm mb-1">
                  {cfg.label}
                </h3>
                <p className={`text-xs font-bold mb-2 ${cfg.textColor}`}>
                  {cfg.range}
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  {cfg.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Rekomendasi Menu & Meal Plan Breakdown ── */}
        {(result || true) &&
          (() => {
            const targetTotal = result?.tdee ? Math.round(result.tdee) : 2000;
            const sarapanKkal = Math.round(targetTotal * 0.25);
            const siangKkal = Math.round(targetTotal * 0.4);
            const malamKkal = Math.round(targetTotal * 0.35);

            const filteredMenus = menus.filter((item) => {
              if (mealTab === "sarapan")
                return item.kalori <= sarapanKkal + 150;
              if (mealTab === "siang")
                return item.kalori >= 350 && item.kalori <= siangKkal + 200;
              if (mealTab === "malam") return item.kalori <= malamKkal + 150;
              return true;
            });

            return (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-black text-text-light flex items-center gap-2">
                      <Utensils size={18} className="text-primary" />
                      Rekomendasi Menu Diet: {result?.status ?? previewStatus}
                    </h2>
                    <p className="text-text-muted text-sm mt-1">
                      Nutrisi seimbang untuk mendukung kebutuhan energi harian Anda (
                      {targetTotal} kcal/hari).
                    </p>
                  </div>
                  <Link
                    href="/menu"
                    className="text-primary text-sm font-black flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap"
                  >
                    Lihat Semua Menu <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Meal Plan Breakdown Banner */}
                <div className="grid grid-cols-3 gap-3 mb-6 bg-card-dark border border-card-border p-3.5 rounded-2xl">
                  <div className="text-center p-2 rounded-xl bg-background-base/60 border border-card-border/60">
                    <span className="text-xs font-bold text-text-light block">
                      🌅 Sarapan (25%)
                    </span>
                    <span className="text-sm font-black text-primary">
                      ~{sarapanKkal} kkal
                    </span>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-background-base/60 border border-card-border/60">
                    <span className="text-xs font-bold text-text-light block">
                      ☀️ Makan Siang (40%)
                    </span>
                    <span className="text-sm font-black text-primary">
                      ~{siangKkal} kkal
                    </span>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-background-base/60 border border-card-border/60">
                    <span className="text-xs font-bold text-text-light block">
                      🌙 Makan Malam (35%)
                    </span>
                    <span className="text-sm font-black text-primary">
                      ~{malamKkal} kkal
                    </span>
                  </div>
                </div>

                {/* Meal Plan Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
                  {[
                    { id: "semua", label: "Semua Menu" },
                    {
                      id: "sarapan",
                      label: `🌅 Sarapan (~${sarapanKkal} kkal)`,
                    },
                    {
                      id: "siang",
                      label: `☀️ Makan Siang (~${siangKkal} kkal)`,
                    },
                    {
                      id: "malam",
                      label: `🌙 Makan Malam (~${malamKkal} kkal)`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setMealTab(tab.id as typeof mealTab)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        mealTab === tab.id
                          ? "bg-primary text-background-dark font-black shadow-[0_0_16px_rgba(0,255,127,0.3)]"
                          : "bg-card-dark text-text-muted border border-card-border hover:text-text-light"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="h-px bg-card-border mb-6" />

                {loadingMenus ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : filteredMenus.length === 0 ? (
                  <div className="text-center py-12 text-text-muted text-sm bg-card-dark/40 border border-card-border rounded-2xl">
                    Belum ada menu yang cocok untuk kategori ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredMenus.map((item) => {
                      const pct = Math.round((item.kalori / targetTotal) * 100);
                      return (
                        <Link key={item.id} href={`/menu/${item.slug}`}>
                          <div className="group bg-card-dark border border-card-border rounded-2xl overflow-hidden hover:border-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,255,127,0.06)]">
                            <div className="relative h-44 overflow-hidden">
                              <Image
                                src={item.gambar}
                                alt={item.nama_menu}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-linear-to-t from-card-dark/80 to-transparent" />
                              <span className="absolute bottom-3 left-3 bg-card-dark/90 border border-primary/30 text-primary text-[10px] font-black px-2.5 py-1 rounded-lg backdrop-blur-md">
                                {pct}% Target Harian
                              </span>
                              <span className="absolute bottom-3 right-3 bg-primary text-background-dark text-[9px] font-black px-2 py-0.5 rounded-full">
                                RECOMMENDED
                              </span>
                            </div>
                            <div className="p-4">
                              <h3 className="font-black text-text-light text-sm mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                {item.nama_menu}
                              </h3>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs text-text-muted">
                                  <span className="flex items-center gap-1 font-bold text-orange-400">
                                    <Flame size={12} /> {item.kalori} kkal
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock
                                      size={12}
                                      className="text-primary/70"
                                    />{" "}
                                    {item.waktu_memasak}m
                                  </span>
                                </div>
                                <ChevronRight
                                  size={14}
                                  className="text-primary opacity-0 group-hover:opacity-100 transition-all"
                                />
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
      </div>
    </div>
  );
}
