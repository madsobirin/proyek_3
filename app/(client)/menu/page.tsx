"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Flame,
  Clock,
  ChevronRight,
  Loader2,
  Shield,
  X,
  Filter,
  Wallet,
} from "lucide-react";

type TargetStatus = "Kurus" | "Normal" | "Berlebih" | "Obesitas";

type Menu = {
  id: number;
  nama_menu: string;
  slug: string;
  deskripsi: string;
  kalori: number;
  target_status: TargetStatus;
  waktu_memasak: number;
  biaya_per_porsi: number | null;
  dibaca: number | null;
  gambar: string;
  created_at: string;
};

const STATUS_CONFIG: Record<
  TargetStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  Kurus: {
    label: "Kurus",
    color: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  Normal: {
    label: "Normal",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
  },
  Berlebih: {
    label: "Berlebih",
    color: "text-yellow-300",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  Obesitas: {
    label: "Obesitas",
    color: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
};

const ALL_STATUS: TargetStatus[] = ["Kurus", "Normal", "Berlebih", "Obesitas"];
const ITEMS_PER_PAGE = 9;
const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function MenuSehatPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [featured, setFeatured] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<TargetStatus | "">("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const changeActiveStatus = (status: TargetStatus | "") => {
    setActiveStatus(status);
    setCurrentPage(1);
  };

  const changeBudgetLimit = (value: string) => {
    setBudgetLimit(value);
    setCurrentPage(1);
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Tutup filter dropdown klik luar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/menus", { cache: "no-store" });
      if (res.ok) {
        const data: Menu[] = await res.json();
        setMenus(data);
        setFeatured(data[0] ?? null);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // Refetch saat balik ke tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchMenus();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchMenus]);

  // Filter
  const filtered = menus.filter((m) => {
    const matchSearch =
      debouncedSearch === "" ||
      m.nama_menu.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      m.deskripsi.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchStatus = activeStatus === "" || m.target_status === activeStatus;
    const maxBudget = budgetLimit === "" ? null : Number(budgetLimit);
    const matchBudget =
      maxBudget === null ||
      (Number.isFinite(maxBudget) &&
        maxBudget > 0 &&
        m.biaya_per_porsi !== null &&
        m.biaya_per_porsi <= maxBudget);
    return matchSearch && matchStatus && matchBudget;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-screen bg-background-base">
      {/* ── Hero Section ── */}
      <section className="relative bg-background-dark pt-16 pb-24 overflow-hidden border-b border-card-border">
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
            <Shield size={11} className="fill-primary" />
            FitLife Premium Menu
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-text-light mb-5 leading-tight tracking-tight">
            Menu Sehat{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-green-300 to-primary">
              Premium
            </span>
          </h1>
          <p className="text-text-muted text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Koleksi resep terkurasi oleh ahli gizi untuk mendukung target kalori
            dan gaya hidup sehat Anda setiap hari.
          </p>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-3xl mx-auto mb-30">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari resep atau bahan makanan..."
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

            <div className="relative w-full sm:w-52 shrink-0">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="number"
                min="1"
                step="1000"
                value={budgetLimit}
                onChange={(e) => changeBudgetLimit(e.target.value)}
                placeholder="Budget maks. (Rp/porsi)"
                aria-label="Batas budget per porsi dalam rupiah"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-card-dark border border-card-border text-text-light placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all text-sm"
              />
            </div>

            {/* Filter dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilter((p) => !p)}
                className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-bold transition-all whitespace-nowrap ${
                  activeStatus
                    ? "bg-primary text-background-dark border-primary shadow-[0_0_16px_rgba(0,255,127,0.3)]"
                    : "bg-card-dark border-card-border text-text-muted hover:border-primary/50 hover:text-primary"
                }`}
              >
                <Filter size={15} />
                {activeStatus || "Filter"}
                {activeStatus && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      changeActiveStatus("");
                    }}
                    className="hover:opacity-70"
                  >
                    <X size={12} />
                  </span>
                )}
              </button>

              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-card-dark border border-card-border rounded-2xl shadow-2xl z-30 overflow-hidden">
                  <button
                    onClick={() => {
                      changeActiveStatus("");
                      setShowFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${activeStatus === "" ? "text-primary font-bold" : "text-text-muted hover:text-text-light hover:bg-background-base/50"}`}
                  >
                    Semua Target
                  </button>
                  {ALL_STATUS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        changeActiveStatus(s);
                        setShowFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${activeStatus === s ? "text-primary font-bold" : "text-text-muted hover:text-text-light hover:bg-background-base/50"}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          s === "Kurus"
                            ? "bg-blue-400"
                            : s === "Normal"
                              ? "bg-primary"
                              : s === "Berlebih"
                                ? "bg-yellow-400"
                                : "bg-red-400"
                        }`}
                      />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-text-muted text-sm">Memuat menu...</p>
            </div>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-text-muted">Belum ada menu tersedia.</p>
          </div>
        ) : (
          <>
            {/* ── Featured / Rekomendasi ── */}
            {featured &&
              !debouncedSearch &&
              !activeStatus &&
              !budgetLimit &&
              currentPage === 1 && (
                <Link href={`/menu/${featured.slug}`}>
                  <div className="group relative bg-card-dark border border-card-border rounded-3xl overflow-hidden mb-12 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,127,0.06)]">
                    <div className="flex flex-col md:flex-row min-h-[300px]">
                      {/* Content */}
                      <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                        <span className="text-xs font-black text-primary tracking-widest uppercase mb-4">
                          Rekomendasi Hari Ini
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-text-light mb-3 leading-tight group-hover:text-primary transition-colors">
                          {featured.nama_menu}
                        </h2>
                        <p className="text-text-muted text-sm leading-relaxed mb-6 line-clamp-2">
                          {featured.deskripsi}
                        </p>
                        <div className="flex items-center gap-3 mb-8">
                          <span className="flex items-center gap-1.5 bg-background-base border border-card-border px-3 py-1.5 rounded-xl text-xs font-bold text-text-light">
                            <Flame size={13} className="text-orange-400" />
                            {featured.kalori} kkal
                          </span>
                          <span className="flex items-center gap-1.5 bg-background-base border border-card-border px-3 py-1.5 rounded-xl text-xs font-bold text-text-light">
                            <Clock size={13} className="text-primary" />
                            {featured.waktu_memasak} mnt
                          </span>
                          {featured.biaya_per_porsi !== null && (
                            <span className="flex items-center gap-1.5 bg-background-base border border-card-border px-3 py-1.5 rounded-xl text-xs font-bold text-text-light">
                              <Wallet size={13} className="text-primary" />
                              {currencyFormatter.format(
                                featured.biaya_per_porsi,
                              )}
                            </span>
                          )}
                        </div>
                        <div className="w-fit">
                          <span className="inline-flex items-center gap-2 bg-primary text-background-dark px-6 py-3 rounded-2xl text-sm font-black hover:bg-primary-hover transition-all shadow-[0_0_20px_rgba(0,255,127,0.3)] group-hover:shadow-[0_0_30px_rgba(0,255,127,0.5)]">
                            Lihat Resep Lengkap <ChevronRight size={16} />
                          </span>
                        </div>
                      </div>

                      {/* Image */}
                      <div className="md:w-1/2 relative h-64 md:h-auto overflow-hidden">
                        <Image
                          src={featured.gambar}
                          alt={featured.nama_menu}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                          priority
                        />
                        <div className="absolute inset-0 bg-linear-to-l from-transparent to-card-dark/30 hidden md:block" />
                        {/* Status badge */}
                        <div
                          className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-black border ${STATUS_CONFIG[featured.target_status].bg} ${STATUS_CONFIG[featured.target_status].color} ${STATUS_CONFIG[featured.target_status].border}`}
                        >
                          {featured.target_status}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

            {/* ── Katalog Title ── */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-text-light">
                  Katalog Menu Terbaru
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  Pilihan menu bergizi untuk kebutuhan nutrisi harian Anda.
                </p>
              </div>
              <span className="text-text-muted text-sm">
                {filtered.length} menu
              </span>
            </div>

            {/* ── Status Filter Pills ── */}
            <div className="flex items-center gap-2 flex-wrap mb-8">
              <button
                onClick={() => changeActiveStatus("")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeStatus === ""
                    ? "bg-primary text-background-dark border-primary"
                    : "bg-card-dark border-card-border text-text-muted hover:border-primary/50 hover:text-primary"
                }`}
              >
                Semua
              </button>
              {ALL_STATUS.map((s) => (
                <button
                  key={s}
                  onClick={() => changeActiveStatus(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    activeStatus === s
                      ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].border}`
                      : "bg-card-dark border-card-border text-text-muted hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* ── Grid ── */}
            {paginated.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-muted">Tidak ada menu yang cocok.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    changeActiveStatus("");
                    changeBudgetLimit("");
                  }}
                  className="mt-3 text-primary text-sm font-semibold hover:underline"
                >
                  Reset filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {paginated.map((item) => (
                  <Link key={item.id} href={`/menu/${item.slug}`}>
                    <div className="group bg-card-dark border border-card-border rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,255,127,0.06)] h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden">
                        <Image
                          src={item.gambar}
                          alt={item.nama_menu}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-card-dark/80 via-card-dark/10 to-transparent" />

                        {/* Wishlist button */}
                        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background-dark/60 backdrop-blur-sm border border-card-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/50 transition-all">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>

                        {/* Premium badge */}
                        <span className="absolute bottom-3 right-3 bg-primary text-background-dark text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wider">
                          PREMIUM
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-black text-text-light text-base leading-snug group-hover:text-primary transition-colors line-clamp-1">
                            {item.nama_menu}
                          </h3>
                        </div>

                        <p className="text-text-muted text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                          {item.deskripsi}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-card-border">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-text-muted">
                              <Flame size={12} className="text-orange-400" />
                              {item.kalori} kkal
                            </span>
                            <span className="flex items-center gap-1 text-xs text-text-muted">
                              <Clock size={12} className="text-primary/70" />
                              {item.waktu_memasak}m
                            </span>
                            {item.biaya_per_porsi !== null && (
                              <span className="flex items-center gap-1 text-xs text-text-muted">
                                <Wallet
                                  size={12}
                                  className="text-primary/70"
                                />
                                {currencyFormatter.format(
                                  item.biaya_per_porsi,
                                )}
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-card-dark border border-card-border text-text-muted hover:border-primary/50 hover:text-primary disabled:opacity-40 transition-all text-sm font-semibold"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                        currentPage === p
                          ? "bg-primary text-background-dark shadow-[0_0_12px_rgba(0,255,127,0.3)]"
                          : "bg-card-dark border border-card-border text-text-muted hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl bg-card-dark border border-card-border text-text-muted hover:border-primary/50 hover:text-primary disabled:opacity-40 transition-all text-sm font-semibold"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
