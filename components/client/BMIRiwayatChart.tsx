"use client";

import { useState, useTransition } from "react";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Trash2,
  Calendar,
  Scale,
  Activity,
  History,
  Sparkles,
  Loader2,
  BarChart3,
} from "lucide-react";

export type PerhitunganItem = {
  id: number;
  user_id: number;
  tinggi_badan: number;
  berat_badan: number;
  bmi: number;
  status: string;
  gender?: string;
  usia?: number;
  aktivitas?: string;
  bmr?: number;
  tdee?: number;
  target_kalori?: number;
  created_at: string;
  updated_at?: string;
};

type BMIRiwayatChartProps = {
  history: PerhitunganItem[];
  onRefreshHistory: () => void;
  isLoggedIn: boolean;
};

export default function BMIRiwayatChart({
  history,
  onRefreshHistory,
  isLoggedIn,
}: BMIRiwayatChartProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  if (!isLoggedIn) {
    return null;
  }

  // Sort chronological (oldest to newest) for chart plotting left-to-right
  const sortedChrono = [...history].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Chronological references (sortedChrono is oldest→newest)
  const oldestEntry = sortedChrono.length > 0 ? sortedChrono[0] : null;
  const latestEntry = sortedChrono.length > 0 ? sortedChrono[sortedChrono.length - 1] : null;
  // Previous entry = second-to-last chronologically
  const prevEntry = sortedChrono.length > 1 ? sortedChrono[sortedChrono.length - 2] : null;

  // Weight changes (correctly computed chronologically)
  const recentDelta =
    latestEntry && prevEntry
      ? parseFloat((latestEntry.berat_badan - prevEntry.berat_badan).toFixed(1))
      : 0;

  const totalDelta =
    latestEntry && oldestEntry && sortedChrono.length > 1
      ? parseFloat((latestEntry.berat_badan - oldestEntry.berat_badan).toFixed(1))
      : 0;

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/perhitungan?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        startTransition(() => {
          onRefreshHistory();
        });
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  // Format tanggal + jam untuk label X-axis, agar 2 entri pada hari yang sama tetap bisa dibedakan
  const formatXAxisLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
      return { date, time };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  // Format jam saja untuk tooltip
  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  // SVG Chart Geometry Constants
  const width = 650;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const weights = sortedChrono.map((d) => d.berat_badan);
  const minW = Math.min(...weights, 30);
  const maxW = Math.max(...weights, 100);
  // Add margin to Y range
  const yMin = Math.max(0, Math.floor(minW - 3));
  const yMax = Math.ceil(maxW + 3);
  const yRange = yMax - yMin || 1;

  const points = sortedChrono.map((item, index) => {
    const x =
      sortedChrono.length === 1
        ? width / 2
        : paddingX +
          (index / (sortedChrono.length - 1)) * (width - paddingX * 2);
    const y =
      height -
      paddingY -
      ((item.berat_badan - yMin) / yRange) * (height - paddingY * 2);
    return { x, y, item, index };
  });

  // Generate SVG path string
  let linePathD = "";
  if (points.length === 1) {
    linePathD = `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
  } else if (points.length > 1) {
    linePathD = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      // Smooth curve with cubic Bezier
      const prev = points[i - 1];
      const cx1 = prev.x + (p.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (p.x - prev.x) / 2;
      const cy2 = p.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
    }, "");
  }

  const areaPathD =
    points.length > 1
      ? `${linePathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : "";

  const activePoint =
    hoveredPointIndex !== null && points[hoveredPointIndex]
      ? points[hoveredPointIndex]
      : points[points.length - 1];

  return (
    <div className="bg-card-dark border border-card-border rounded-3xl p-6 md:p-8 mb-10 overflow-hidden shadow-xl relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-2">
            <Activity size={12} /> Progress Tracking
          </div>
          <h2 className="text-xl md:text-2xl font-black text-text-light flex items-center gap-2">
            Riwayat & Tren Berat Badan
          </h2>
          <p className="text-text-muted text-xs md:text-sm mt-1">
            Visualisasi perubahan berat badan dan indeks massa tubuh dari setiap pengukuran Anda.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-text-muted font-bold bg-background-base border border-card-border px-3.5 py-2 rounded-xl flex items-center gap-1.5">
              <History size={14} className="text-primary" />
              {history.length} Catatan
            </span>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 px-4 bg-background-base/40 border border-card-border/60 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
            <BarChart3 size={24} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-text-light mb-1">
            Belum Ada Riwayat Perhitungan
          </h3>
          <p className="text-text-muted text-xs max-w-md mx-auto">
            Hitung BMI Anda menggunakan form di atas untuk mulai mencatat dan memantau tren perkembangan kesehatan Anda secara otomatis.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 relative z-10">
            {/* Card 1: Berat Terbaru */}
            <div className="bg-background-base/60 border border-card-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-text-muted mb-1 flex items-center gap-1">
                <Scale size={13} className="text-primary" /> Berat Terbaru
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-text-light">
                  {latestEntry?.berat_badan}
                </span>
                <span className="text-xs font-bold text-text-muted">kg</span>
              </div>
              {history.length > 1 && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
                  {recentDelta < 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                      <TrendingDown size={11} /> {Math.abs(recentDelta)} kg
                    </span>
                  ) : recentDelta > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                      <TrendingUp size={11} /> +{recentDelta} kg
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-text-muted bg-white/5 px-2 py-0.5 rounded-md border border-card-border">
                      <Minus size={11} /> Tetap
                    </span>
                  )}
                  <span className="text-text-muted/60">vs pengukuran lalu</span>
                </div>
              )}
            </div>

            {/* Card 2: BMI Terkini */}
            <div className="bg-background-base/60 border border-card-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-text-muted mb-1 flex items-center gap-1">
                <Activity size={13} className="text-primary" /> BMI Terkini
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary">
                  {latestEntry?.bmi}
                </span>
              </div>
              <span className="inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25">
                {latestEntry?.status}
              </span>
            </div>

            {/* Card 3: Total Perubahan */}
            <div className="bg-background-base/60 border border-card-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-text-muted mb-1">Total Perubahan</p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-black ${
                    totalDelta < 0
                      ? "text-green-400"
                      : totalDelta > 0
                      ? "text-yellow-400"
                      : "text-text-light"
                  }`}
                >
                  {sortedChrono.length <= 1
                    ? "—"
                    : totalDelta > 0
                    ? `+${totalDelta}`
                    : totalDelta}
                </span>
                {sortedChrono.length > 1 && (
                  <span className="text-xs font-bold text-text-muted">kg</span>
                )}
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                {sortedChrono.length <= 1
                  ? "Butuh ≥2 catatan untuk melihat perubahan"
                  : `Pengukuran pertama → terbaru`}
              </p>
            </div>

            {/* Card 4: Insight / Status Motivasi */}
            <div className="bg-background-base/60 border border-card-border rounded-2xl p-4 flex flex-col justify-between">
              <p className="text-[11px] font-bold text-text-muted flex items-center gap-1">
                <Sparkles size={12} className="text-primary" /> Status Tren
              </p>
              <div className="text-xs font-bold leading-tight text-text-light my-1">
                {totalDelta < -0.5
                  ? "📉 Penurunan konsisten"
                  : totalDelta > 0.5
                  ? "📈 Kenaikan terdeteksi"
                  : "⚖️ Berat relatif stabil"}
              </div>
              <p className="text-[10px] text-text-muted">
                {history.length} x total pencatatan
              </p>
            </div>
          </div>

          {/* Interactive SVG Chart */}
          <div className="bg-background-base/80 border border-card-border rounded-2xl p-4 md:p-6 mb-8 relative">
            <div className="flex items-center justify-between text-xs text-text-muted font-bold mb-1">
              <span>↑ Berat Badan (kg)</span>
              <span>Urutan Pengukuran (terlama → terbaru) →</span>
            </div>
            <p className="text-[10px] text-text-muted/50 mb-4">Klik titik pada grafik untuk melihat detail pengukuran</p>

            <div className="relative w-full overflow-x-auto">
              <div className="min-w-[500px]">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-auto overflow-visible"
                >
                  <defs>
                    <linearGradient id="bmiAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary, #00ff7f)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--color-primary, #00ff7f)" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                    const yVal = height - paddingY - ratio * (height - paddingY * 2);
                    const labelVal = Math.round(yMin + ratio * yRange);
                    return (
                      <g key={idx}>
                        <line
                          x1={paddingX}
                          y1={yVal}
                          x2={width - paddingX}
                          y2={yVal}
                          stroke="currentColor"
                          className="text-card-border"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 8}
                          y={yVal + 3}
                          fill="currentColor"
                          className="text-[9px] fill-text-muted/60 font-mono"
                          textAnchor="end"
                        >
                          {labelVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Area Fill */}
                  {areaPathD && (
                    <path d={areaPathD} fill="url(#bmiAreaGradient)" />
                  )}

                  {/* Trend Line */}
                  {linePathD && (
                    <path
                      d={linePathD}
                      fill="none"
                      stroke="var(--color-primary, #00ff7f)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow)"
                    />
                  )}

                  {/* Data Points */}
                  {points.map((p, idx) => {
                    const isHovered = activePoint?.index === idx;
                    return (
                      <g
                        key={p.item.id}
                        className="cursor-pointer transition-transform duration-200"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onClick={() => setHoveredPointIndex(idx)}
                      >
                        {/* Outer Glow Ring when Hovered */}
                        {isHovered && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="10"
                            fill="var(--color-primary, #00ff7f)"
                            fillOpacity="0.25"
                            className="animate-ping"
                          />
                        )}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? "6.5" : "4.5"}
                          fill="var(--color-background-dark, #0d131a)"
                          stroke="var(--color-primary, #00ff7f)"
                          strokeWidth={isHovered ? "3" : "2.5"}
                        />
                        {/* Label Date + Time X-Axis (2 baris agar sama-hari bisa dibedakan) */}
                        {(() => {
                          const { date, time } = formatXAxisLabel(p.item.created_at);
                          const cls = isHovered ? "fill-primary" : "fill-text-muted/60";
                          return (
                            <>
                              <text
                                x={p.x}
                                y={height - 14}
                                fill="currentColor"
                                className={`text-[9px] font-bold ${cls}`}
                                textAnchor="middle"
                              >
                                {date}
                              </text>
                              <text
                                x={p.x}
                                y={height - 3}
                                fill="currentColor"
                                className={`text-[8px] ${cls}`}
                                textAnchor="middle"
                              >
                                {time}
                              </text>
                            </>
                          );
                        })()}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Active Point Hover Banner / Tooltip Detail */}
            {activePoint && (
              <div className="mt-4 pt-4 border-t border-card-border/60 flex flex-wrap items-center justify-between gap-3 bg-card-dark/60 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-text-light flex items-center gap-1.5">
                    <Calendar size={13} className="text-text-muted" />
                    {formatDate(activePoint.item.created_at)}
                    <span className="text-text-muted font-normal">pukul {formatTime(activePoint.item.created_at)}</span>
                    <span className="ml-1 text-[10px] text-text-muted/50 font-normal bg-white/5 border border-card-border px-2 py-0.5 rounded-md">
                      Pengukuran ke-{activePoint.index + 1} dari {points.length}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-text-muted">Tinggi: </span>
                    <span className="font-bold text-text-light">
                      {activePoint.item.tinggi_badan} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Berat: </span>
                    <span className="font-black text-primary">
                      {activePoint.item.berat_badan} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">BMI: </span>
                    <span className="font-bold text-text-light">
                      {activePoint.item.bmi}
                    </span>
                    <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {activePoint.item.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History List Table */}
          <div>
            <h3 className="text-sm font-black text-text-light flex items-center gap-2 mb-3">
              <History size={15} className="text-primary" />
              Daftar Catatan Perhitungan
            </h3>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-background-base/60 border border-card-border/80 hover:border-primary/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-card-dark border border-card-border flex items-center justify-center text-primary font-black text-xs shrink-0">
                      {item.bmi}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-text-light">
                          {item.berat_badan} kg
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-card-border text-text-muted">
                          {item.tinggi_badan} cm
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Hapus entri ini"
                    className="p-2 text-text-muted/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 size={15} className="animate-spin text-red-400" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
