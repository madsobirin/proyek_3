"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  BookOpen,
  Eye,
  Clock,
  Star,
  ChevronRight,
  Loader2,
  Tag,
  Globe,
  ExternalLink,
  Newspaper,
  AlertCircle,
} from "lucide-react";

type Artikel = {
  id: number;
  judul: string;
  slug: string;
  kategori: string;
  penulis: string;
  gambar: string;
  is_featured: boolean | null;
  dibaca: number | null;
  isi: string;
  created_at: string;
};

type NewsItem = {
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  source: string;
  author: string | null;
  publishedAt: string;
};

const ITEMS_PER_PAGE = 9;

export default function ArtikelPage() {
  const [activeTab, setActiveTab] = useState<"internal" | "news">("internal");

  // State Artikel FitLife (Internal)
  const [artikels, setArtikels] = useState<Artikel[]>([]);
  const [featured, setFeatured] = useState<Artikel | null>(null);
  const [loadingInternal, setLoadingInternal] = useState(true);
  const [activeKategori, setActiveKategori] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // State FitNews (NewsAPI)
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [totalNewsResults, setTotalNewsResults] = useState(0);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsPage, setNewsPage] = useState(1);

  // Search State (Shared)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
      setNewsPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeKategori]);

  // Fetch Internal Articles
  const fetchArtikels = useCallback(async () => {
    setLoadingInternal(true);
    try {
      const res = await fetch("/api/artikels");
      if (res.ok) {
        const data: Artikel[] = await res.json();
        setArtikels(data);
        setFeatured(data.find((a) => a.is_featured) ?? data[0] ?? null);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingInternal(false);
    }
  }, []);

  // Fetch NewsAPI (FitNews)
  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    setNewsError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      params.set("page", newsPage.toString());
      params.set("pageSize", ITEMS_PER_PAGE.toString());

      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();

      if (data.error) {
        setNewsError(data.error);
        setNewsList([]);
      } else {
        setNewsList(data.articles || []);
        setTotalNewsResults(data.totalResults || 0);
      }
    } catch {
      setNewsError("Gagal memuat berita. Periksa koneksi internet Anda.");
      setNewsList([]);
    } finally {
      setLoadingNews(false);
    }
  }, [debouncedSearch, newsPage]);

  useEffect(() => {
    fetchArtikels();
  }, [fetchArtikels]);

  useEffect(() => {
    if (activeTab === "news") {
      fetchNews();
    }
  }, [activeTab, fetchNews]);

  // Kategori unik untuk artikel internal
  const kategoris = [...new Set(artikels.map((a) => a.kategori))];

  // Filter artikel internal
  const filtered = artikels.filter((a) => {
    const matchSearch =
      debouncedSearch === "" ||
      a.judul.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      a.kategori.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchKategori =
      activeKategori === "" || a.kategori === activeKategori;
    return matchSearch && matchKategori;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalNewsPages = Math.min(
    10, // NewsAPI free tier limits results to top 100
    Math.max(1, Math.ceil(totalNewsResults / ITEMS_PER_PAGE))
  );

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, "").slice(0, 120) + "...";

  return (
    <div className="min-h-screen bg-background-base">
      {/* ── Hero / Header ── */}
      <section className="relative bg-background-dark pt-16 pb-20 overflow-hidden border-b border-card-border">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/3 blur-[100px] rounded-full pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card-dark border border-card-border text-primary text-xs font-bold tracking-widest uppercase mb-6">
            <BookOpen size={12} />
            Artikel & Edukasi
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-text-light mb-4 leading-tight">
            Artikel Diet &{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-green-300">
              Kesehatan
            </span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-8">
            Temukan wawasan terbaru seputar nutrisi, gaya hidup, dan tips
            praktis untuk transformasi tubuh Anda.
          </p>

          {/* Tab Navigasi: Artikel FitLife vs FitNews */}
          <div className="inline-flex items-center p-1.5 bg-card-dark border border-card-border rounded-2xl mb-8 shadow-sm">
            <button
              onClick={() => {
                setActiveTab("internal");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "internal"
                  ? "bg-primary text-background-dark shadow-[0_0_16px_rgba(0,255,127,0.25)]"
                  : "text-text-muted hover:text-text-light"
              }`}
            >
              <BookOpen size={15} />
              <span>Artikel FitLife</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("news");
                setNewsPage(1);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "news"
                  ? "bg-primary text-background-dark shadow-[0_0_16px_rgba(0,255,127,0.25)]"
                  : "text-text-muted hover:text-text-light"
              }`}
            >
              <Globe size={15} />
              <span>FitNews</span>
              <span
                className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                  activeTab === "news"
                    ? "bg-emerald-950/20 text-background-dark"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                LIVE
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "internal"
                  ? "Cari artikel atau kategori (misal: Diet, Olahraga)..."
                  : "Cari berita kesehatan (misal: Nutrisi, Diabetes, Jantung)..."
              }
              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-card-dark border border-card-border text-text-light placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,127,0.08)] transition-all text-sm"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ================= TAB 1: ARTIKEL FITLIFE (INTERNAL) ================= */}
        {activeTab === "internal" && (
          <>
            {loadingInternal ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-text-muted text-sm">Memuat artikel...</p>
                </div>
              </div>
            ) : artikels.length === 0 ? (
              <div className="text-center py-24">
                <BookOpen className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
                <p className="text-text-muted">Belum ada artikel tersedia.</p>
              </div>
            ) : (
              <>
                {/* Featured Article */}
                {featured &&
                  !debouncedSearch &&
                  !activeKategori &&
                  currentPage === 1 && (
                    <div className="mb-12">
                      <Link href={`/artikel/${featured.slug}`}>
                        <div className="group relative bg-card-dark border border-card-border rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,127,0.06)]">
                          <div className="flex flex-col md:flex-row">
                            <div className="relative md:w-1/2 h-64 md:h-auto overflow-hidden">
                              <Image
                                src={featured.gambar}
                                alt={featured.judul}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-linear-to-r from-transparent to-card-dark/20 hidden md:block" />
                              <span className="absolute top-4 left-4 bg-primary text-background-dark text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                <Star size={10} className="fill-background-dark" />
                                UNGGULAN
                              </span>
                            </div>

                            <div className="md:w-1/2 p-8 flex flex-col justify-center">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs text-primary font-bold bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                                  {featured.kategori}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                  <Clock size={11} />
                                  {formatDate(featured.created_at)}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                  <Eye size={11} />
                                  {featured.dibaca ?? 0} views
                                </span>
                              </div>

                              <h2 className="text-2xl md:text-3xl font-black text-text-light mb-3 leading-tight group-hover:text-primary transition-colors">
                                {featured.judul}
                              </h2>

                              <p className="text-text-muted text-sm leading-relaxed mb-6 line-clamp-3">
                                {stripHtml(featured.isi)}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                                    {featured.penulis[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-text-light">
                                      {featured.penulis}
                                    </p>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">
                                      Editor
                                    </p>
                                  </div>
                                </div>
                                <span className="flex items-center gap-1.5 text-primary text-sm font-bold group-hover:gap-2.5 transition-all">
                                  Baca Selengkapnya <ChevronRight size={16} />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                {/* Kategori Filter */}
                {kategoris.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mb-8">
                    <Tag size={14} className="text-text-muted" />
                    <button
                      onClick={() => setActiveKategori("")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        activeKategori === ""
                          ? "bg-primary text-background-dark border-primary"
                          : "bg-card-dark border-card-border text-text-muted hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      Semua
                    </button>
                    {kategoris.map((k) => (
                      <button
                        key={k}
                        onClick={() => setActiveKategori(k)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          activeKategori === k
                            ? "bg-primary text-background-dark border-primary"
                            : "bg-card-dark border-card-border text-text-muted hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                )}

                {/* Section Title */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="text-xl font-black text-text-light">
                    {activeKategori || debouncedSearch
                      ? "Hasil Pencarian"
                      : "Artikel Terbaru"}
                  </h2>
                  <span className="text-text-muted text-sm">
                    ({filtered.length})
                  </span>
                </div>

                {/* Grid Artikel Internal */}
                {paginated.length === 0 ? (
                  <div className="text-center py-16">
                    <Search className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                    <p className="text-text-muted">Tidak ada artikel yang cocok.</p>
                    <button
                      onClick={() => {
                        setSearch("");
                        setActiveKategori("");
                      }}
                      className="mt-3 text-primary text-sm font-semibold hover:underline"
                    >
                      Reset pencarian
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {paginated.map((item) => (
                      <Link key={item.id} href={`/artikel/${item.slug}`}>
                        <div className="group bg-card-dark border border-card-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-[0_4px_24px_rgba(0,255,127,0.06)] hover:-translate-y-1 h-full flex flex-col">
                          <div className="relative h-48 overflow-hidden">
                            <Image
                              src={item.gambar}
                              alt={item.judul}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-card-dark/60 to-transparent" />
                            {item.is_featured && (
                              <span className="absolute top-3 left-3 bg-primary text-background-dark text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star size={9} className="fill-background-dark" />{" "}
                                UNGGULAN
                              </span>
                            )}
                            <span className="absolute bottom-3 left-3 bg-background-dark/80 backdrop-blur-sm text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                              {item.kategori}
                            </span>
                          </div>

                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-center gap-3 mb-3 text-[11px] text-text-muted">
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> {formatDate(item.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={10} /> {item.dibaca ?? 0}
                              </span>
                            </div>

                            <h3 className="font-bold text-text-light text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
                              {item.judul}
                            </h3>

                            <p className="text-text-muted text-xs leading-relaxed line-clamp-2 mb-4">
                              {stripHtml(item.isi)}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-card-border">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-black">
                                  {item.penulis[0].toUpperCase()}
                                </div>
                                <span className="text-[11px] text-text-muted font-medium">
                                  {item.penulis}
                                </span>
                              </div>
                              <span className="text-primary text-[11px] font-bold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                                Baca <ChevronRight size={12} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Pagination Internal */}
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
                      )
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
          </>
        )}

        {/* ================= TAB 2: FITNEWS (NEWSAPI) ================= */}
        {activeTab === "news" && (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-xl font-black text-text-light">
                  FitNews — Berita Kesehatan Global
                </h2>
                {!loadingNews && !newsError && (
                  <span className="text-text-muted text-sm">
                    ({totalNewsResults} berita)
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <Globe size={13} className="text-primary" />
                Disinkronkan via NewsAPI
              </span>
            </div>

            {loadingNews ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-text-muted text-sm">Mengambil berita terkini...</p>
                </div>
              </div>
            ) : newsError ? (
              <div className="p-8 rounded-2xl bg-card-dark border border-red-500/20 text-center max-w-lg mx-auto my-12">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-text-light font-bold mb-2">Pemberitahuan Berita</h3>
                <p className="text-text-muted text-sm mb-4 leading-relaxed">
                  {newsError}
                </p>
                <button
                  onClick={() => fetchNews()}
                  className="px-5 py-2.5 rounded-xl bg-primary text-background-dark text-xs font-bold hover:opacity-90 transition-all"
                >
                  Coba Muat Ulang
                </button>
              </div>
            ) : newsList.length === 0 ? (
              <div className="text-center py-16">
                <Newspaper className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-text-muted">Tidak ada berita ditemukan untuk pencarian ini.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setNewsPage(1);
                  }}
                  className="mt-3 text-primary text-sm font-semibold hover:underline"
                >
                  Reset kata kunci
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {newsList.map((item, idx) => (
                    <a
                      key={`${item.url}-${idx}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-card-dark border border-card-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-[0_4px_24px_rgba(0,255,127,0.06)] hover:-translate-y-1 flex flex-col h-full"
                    >
                      {/* Thumbnail Berita */}
                      <div className="relative h-48 bg-secondary/40 overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                              // Fallback jika gambar eksternal gagal dimuat
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-text-muted/40">
                            <Newspaper size={36} />
                            <span className="text-[11px]">FitLife News</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-background-dark/90 backdrop-blur-xs text-primary border border-primary/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {item.source}
                        </span>
                      </div>

                      {/* Konten Berita */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-2.5 text-[11px] text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {formatDate(item.publishedAt)}
                          </span>
                          {item.author && (
                            <span className="line-clamp-1 max-w-[140px]">
                              Oleh {item.author}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-text-light text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
                          {item.title}
                        </h3>

                        <p className="text-text-muted text-xs leading-relaxed line-clamp-3 mb-4">
                          {item.description || "Klik untuk membaca laporan lengkap di situs sumber."}
                        </p>

                        <div className="mt-auto pt-3 border-t border-card-border flex items-center justify-between text-primary text-xs font-bold">
                          <span>Baca di {item.source}</span>
                          <ExternalLink size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Pagination FitNews */}
                {totalNewsPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setNewsPage((p) => Math.max(1, p - 1))}
                      disabled={newsPage === 1}
                      className="px-4 py-2 rounded-xl bg-card-dark border border-card-border text-text-muted hover:border-primary/50 hover:text-primary disabled:opacity-40 transition-all text-sm font-semibold"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalNewsPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setNewsPage(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                            newsPage === p
                              ? "bg-primary text-background-dark shadow-[0_0_12px_rgba(0,255,127,0.3)]"
                              : "bg-card-dark border border-card-border text-text-muted hover:border-primary/50 hover:text-primary"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setNewsPage((p) => Math.min(totalNewsPages, p + 1))
                      }
                      disabled={newsPage === totalNewsPages}
                      className="px-4 py-2 rounded-xl bg-card-dark border border-card-border text-text-muted hover:border-primary/50 hover:text-primary disabled:opacity-40 transition-all text-sm font-semibold"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
