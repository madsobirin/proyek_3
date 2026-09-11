"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Lock,
} from "lucide-react";
import BMIRiwayatChart, { PerhitunganItem } from "@/components/client/BMIRiwayatChart";

type TargetStatus = "Kurus" | "Normal" | "Berlebih" | "Obesitas";

type BMIResult = {
  bmi: number;
  status: TargetStatus;
  bmr?: number;
  tdee?: number;
  target_kalori?: number;
  jenis_target?: string;
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
  { id: "rebahan", label: "Rebahan", desc: "Jarang / tidak pernah olahraga" },
  { id: "ringan", label: "Ringan", desc: "Olahraga 1–3 hari/minggu" },
  { id: "sedang", label: "Sedang", desc: "Olahraga 3–5 hari/minggu" },
  { id: "berat", label: "Berat", desc: "Olahraga 6–7 hari/minggu" },
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
  const router = useRouter();

  const [gender, setGender] = useState<"pria" | "wanita">("pria");
  const [tinggi, setTinggi] = useState(170);
  const [berat, setBerat] = useState(65);
  const [usia, setUsia] = useState(25);
  const [aktivitas, setAktivitas] = useState<"rebahan" | "ringan" | "sedang" | "berat">("sedang");
  const [result, setResult] = useState<BMIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [history, setHistory] = useState<PerhitunganItem[]>([]);
  const [mealTab, setMealTab] = useState<"semua" | "sarapan" | "siang" | "malam">("semua");

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
        setAuthChecked(true);
        if (r.ok) {
          fetchHistory();
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        setAuthChecked(true);
      });
  }, []);

  // Auto hitung preview BMI
  const previewBMI = parseFloat((berat / Math.pow(tinggi / 100, 2)).toFixed(1));
  const previewStatus: TargetStatus =
    previewBMI < 18.5
      ? "Kurus"
      : previewBMI < 25
        ? "Normal"
        : previewBMI < 30
          ? "Berlebih"
          : "Obesitas";

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
        // Refresh history
        fetchHistory();
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
      {authChecked && !isLoggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-md bg-background-dark/60" />
          <div className="relative z-10 bg-card-dark border border-card-border rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <Lock size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-black text-text-light mb-2">
              Akses Terbatas
            </h2>
            <p className="text-text-muted text-sm leading-relaxed mb-6">
              Silakan login atau daftar akun FitLife terlebih dahulu untuk
              menggunakan fitur Kalkulator BMI kami.
            </p>
            <Link
              href="/login"
              className="block w-full bg-primary hover:bg-primary-hover text-background-dark font-black py-3.5 rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(0,255,127,0.4)] hover:shadow-[0_0_30px_rgba(0,255,127,0.6)] mb-3"
            >
              Masuk / Daftar Sekarang
            </Link>
            <button
              onClick={() => router.push("/")}
              className="w-full text-text-muted text-sm font-bold hover:text-text-light transition-colors py-2"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}

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
                  <span className="text-xs text-text-muted font-bold">Tahun</span>
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
                    onClick={() => setAktivitas(opt.id as any)}
                    className={`flex flex-col text-left p-3 rounded-2xl border text-xs transition-all ${
                      aktivitas === opt.id
                        ? "border-primary bg-primary/10 text-primary font-black shadow-[0_0_14px_rgba(0,255,127,0.12)]"
                        : "border-card-border bg-background-base/40 text-text-muted hover:border-primary/40 hover:text-text-light"
                    }`}
                  >
                    <span className="font-bold text-text-light">{opt.label}</span>
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
                  <BarChart2 size={18} /> Hitung BMI & Kalori Saya
                </>
              )}
            </button>
          </div>

          {/* Right — Result */}
          <div className="flex flex-col gap-4">
            {/* Hasil */}
            <div className="bg-card-dark border border-card-border rounded-3xl p-6 md:p-8 flex-1">
              <h2 className="text-base font-black text-text-light flex items-center gap-2 mb-6">
                <BarChart2 size={16} className="text-primary" />
                Hasil Analisis BMI & Kalori
              </h2>

              {result ? (
                <div>
                  {/* Status BMI Card */}
                  <div
                    className={`bg-background-base border ${statusCfg!.border} rounded-2xl p-5 mb-4 text-center`}
                  >
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-2xl font-black ${statusCfg!.bg} ${statusCfg!.color} border ${statusCfg!.border}`}
                    >
                      {result.status}
                    </span>
                    <p className={`text-sm font-black ${statusCfg!.color} mt-2`}>
                      Skor BMI: {result.bmi}
                    </p>
                  </div>

                  {/* Kalori Section Card */}
                  {result.tdee && (
                    <div className="bg-background-base/60 border border-card-border rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-card-border/60 pb-2.5">
                        <span className="text-xs font-bold text-text-muted">
                          🔥 BMR (Metabolisme Basal)
                        </span>
                        <span className="text-sm font-black text-text-light">
                          {result.bmr} <span className="text-[10px] text-text-muted font-bold">kkal/hari</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-card-border/60 pb-2.5">
                        <span className="text-xs font-bold text-text-muted">
                          ⚡ TDEE (Kebutuhan Harian)
                        </span>
                        <span className="text-sm font-black text-text-light">
                          {result.tdee} <span className="text-[10px] text-text-muted font-bold">kkal/hari</span>
                        </span>
                      </div>

                      <div className="bg-primary/10 border border-primary/25 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-black text-primary">
                            Target Asupan Kalori
                          </p>
                          <p className="text-xs font-bold text-text-muted">
                            {result.jenis_target}
                          </p>
                        </div>
                        <span className="text-xl font-black text-primary">
                          {result.target_kalori}{" "}
                          <span className="text-xs font-bold text-primary/70">kkal</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Penjelasan Istilah Kalori (BMR & TDEE) */}
                  <div className="mt-4 bg-background-base/40 border border-card-border/60 rounded-2xl p-4 text-left space-y-2.5">
                    <p className="text-xs font-black text-text-light flex items-center gap-1.5 border-b border-card-border/40 pb-2">
                      <Lightbulb size={14} className="text-primary" /> Panduan Istilah Kalori:
                    </p>
                    <div className="text-[11px] leading-relaxed text-text-muted space-y-1.5">
                      <p>
                        <strong className="text-text-light font-bold">🔥 BMR (Basal Metabolic Rate):</strong> Energi minimal yang dibakar tubuh saat istirahat total hanya untuk fungsi organ vital (jantung, bernapas, dan otak).
                      </p>
                      <p>
                        <strong className="text-text-light font-bold">⚡ TDEE (Total Energy Expenditure):</strong> Total kalori harian nyata yang Anda bakar setelah memperhitungkan olahraga & aktivitas fisik harian.
                      </p>
                      <p>
                        <strong className="text-text-light font-bold">🎯 Target Kalori:</strong> Rekomendasi asupan makan harian agar berat badan Anda ideal (defisit untuk turun, surplus untuk naik).
                      </p>
                    </div>
                  </div>

                  <p className="text-text-muted text-xs leading-relaxed text-center mt-4">
                    Asupan {result.target_kalori ?? 2000} kkal/hari akan membantu Anda mencapai berat badan ideal secara bertahap dan aman.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-block bg-background-base border border-card-border rounded-2xl px-6 py-5 mb-4 w-full">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-2xl font-black ${STATUS_CONFIG[previewStatus].bg} ${STATUS_CONFIG[previewStatus].color} border ${STATUS_CONFIG[previewStatus].border}`}
                    >
                      {previewStatus}
                    </span>
                    <p className="text-sm font-black text-primary mb-2">
                      BMI: {previewBMI}
                    </p>
                  </div>
                  <p className="text-text-muted text-sm">
                    Pilih usia & aktivitas harian lalu tekan tombol hitung untuk melihat kebutuhan kalori harian Anda.
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

        {/* ── Riwayat & Progress Chart ── */}
        <BMIRiwayatChart
          history={history}
          onRefreshHistory={fetchHistory}
          isLoggedIn={isLoggedIn}
        />

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
        {(result || true) && (() => {
          const targetTotal = result?.target_kalori ?? 2000;
          const sarapanKkal = Math.round(targetTotal * 0.25);
          const siangKkal = Math.round(targetTotal * 0.40);
          const malamKkal = Math.round(targetTotal * 0.35);

          const filteredMenus = menus.filter((item) => {
            if (mealTab === "sarapan") return item.kalori <= sarapanKkal + 150;
            if (mealTab === "siang") return item.kalori >= 350 && item.kalori <= siangKkal + 200;
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
                    Nutrisi khusus untuk mendukung target kalori Harian Anda ({targetTotal} kkal/hari).
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
                  <span className="text-xs font-bold text-text-light block">🌅 Sarapan (25%)</span>
                  <span className="text-sm font-black text-primary">~{sarapanKkal} kkal</span>
                </div>
                <div className="text-center p-2 rounded-xl bg-background-base/60 border border-card-border/60">
                  <span className="text-xs font-bold text-text-light block">☀️ Makan Siang (40%)</span>
                  <span className="text-sm font-black text-primary">~{siangKkal} kkal</span>
                </div>
                <div className="text-center p-2 rounded-xl bg-background-base/60 border border-card-border/60">
                  <span className="text-xs font-bold text-text-light block">🌙 Makan Malam (35%)</span>
                  <span className="text-sm font-black text-primary">~{malamKkal} kkal</span>
                </div>
              </div>

              {/* Meal Plan Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
                {[
                  { id: "semua", label: "Semua Menu" },
                  { id: "sarapan", label: `🌅 Sarapan (~${sarapanKkal} kkal)` },
                  { id: "siang", label: `☀️ Makan Siang (~${siangKkal} kkal)` },
                  { id: "malam", label: `🌙 Makan Malam (~${malamKkal} kkal)` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMealTab(tab.id as any)}
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
                                  <Clock size={12} className="text-primary/70" />{" "}
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
