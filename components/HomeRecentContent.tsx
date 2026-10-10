"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Utensils,
  BookOpen,
  ChevronRight,
  Flame,
  Clock,
  Loader2,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

type Menu = {
  id: number;
  nama_menu: string;
  slug: string;
  kalori: number;
  waktu_memasak: number;
  gambar: string;
};

type Artikel = {
  id: number;
  judul: string;
  slug: string;
  kategori: string;
  gambar: string;
};

const ITEMS_PER_PAGE = 5;

function usePagination<T>(data: T[]) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
  const paginated = data.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );
  return { page, setPage, totalPages, paginated };
}

const MiniPagination = ({
  page,
  setPage,
  totalPages,
}: {
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3 mt-2 border-t border-card-border">
      <span className="text-[11px] text-text-muted">
        Hal {page} / {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-7 h-7 rounded-lg bg-background-base border border-card-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
              page === p
                ? "bg-primary text-primary-foreground font-black"
                : "bg-background-base border border-card-border text-text-muted hover:text-primary hover:border-primary/40"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-7 h-7 rounded-lg bg-background-base border border-card-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 disabled:opacity-30 transition-all"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default function HomeRecentContent() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [artikels, setArtikels] = useState<Artikel[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingArtikel, setLoadingArtikel] = useState(true);

  const menuPagination = usePagination(menus);
  const artikelPagination = usePagination(artikels);

  useEffect(() => {
    fetch("/api/menus")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Menu[]) => setMenus(data))
      .catch(() => setMenus([]))
      .finally(() => setLoadingMenu(false));
  }, []);

  useEffect(() => {
    fetch("/api/artikels")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Artikel[]) => setArtikels(data))
      .catch(() => setArtikels([]))
      .finally(() => setLoadingArtikel(false));
  }, []);

  return (
    <section className="py-12 md:py-16 bg-background-base border-t border-card-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title mobile */}
        <div className="mb-6 md:hidden">
          <h2 className="text-lg font-black text-text-light">Konten Terbaru</h2>
          <p className="text-text-muted text-xs mt-0.5">
            Menu & artikel pilihan untuk Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          {/* ── Menu Sehat Terbaru ── */}
          <div className="bg-card-dark rounded-2xl p-4 sm:p-6 shadow-sm border border-card-border flex flex-col">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-xl font-bold text-text-light flex items-center gap-2">
                <Utensils size={18} className="text-primary shrink-0" />
                <span>Menu Sehat Terbaru</span>
              </h3>
              <Link
                href="/menu"
                className="text-primary text-xs sm:text-sm font-semibold hover:text-text-light transition flex items-center gap-1 group shrink-0 ml-2"
              >
                <span className="hidden sm:inline">Lihat semua</span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </div>

            {loadingMenu ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : menus.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8 text-text-muted italic bg-background-base/50 rounded-xl border border-dashed border-card-border text-sm">
                Belum ada menu yang tersedia.
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                <div className="space-y-0.5 flex-1">
                  {menuPagination.paginated.map((item) => (
                    <Link key={item.id} href={`/menu/${item.slug}`}>
                      <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-background-base/60 transition-all group cursor-pointer">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border border-card-border">
                          <Image
                            src={item.gambar}
                            alt={item.nama_menu}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-text-light truncate group-hover:text-primary transition-colors">
                            {item.nama_menu}
                          </p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-text-muted uppercase tracking-wide">
                              <Flame size={10} className="text-orange-400" />
                              {item.kalori}kkal
                            </span>
                            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-text-muted uppercase tracking-wide">
                              <Clock size={10} className="text-primary/70" />
                              {item.waktu_memasak}m
                            </span>
                          </div>
                        </div>
                        {/* Arrow */}
                        <ChevronRight
                          size={14}
                          className="text-text-muted/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </div>
                    </Link>
                  ))}
                </div>

                <MiniPagination
                  page={menuPagination.page}
                  setPage={menuPagination.setPage}
                  totalPages={menuPagination.totalPages}
                />
              </div>
            )}
          </div>

          {/* ── Artikel Terbaru ── */}
          <div className="bg-card-dark rounded-2xl p-4 sm:p-6 shadow-sm border border-card-border flex flex-col">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-xl font-bold text-text-light flex items-center gap-2">
                <BookOpen size={18} className="text-primary shrink-0" />
                <span>Artikel Terbaru</span>
              </h3>
              <Link
                href="/artikel"
                className="text-primary text-xs sm:text-sm font-semibold hover:text-text-light transition flex items-center gap-1 group shrink-0 ml-2"
              >
                <span className="hidden sm:inline">Lihat semua</span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </div>

            {loadingArtikel ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : artikels.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8 text-text-muted italic bg-background-base/50 rounded-xl border border-dashed border-card-border text-sm">
                Belum ada artikel.
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                <div className="space-y-0.5 flex-1">
                  {artikelPagination.paginated.map((item) => (
                    <Link key={item.id} href={`/artikel/${item.slug}`}>
                      <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-background-base/60 transition-all group cursor-pointer">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border border-card-border">
                          <Image
                            src={item.gambar}
                            alt={item.judul}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5 truncate">
                            {item.kategori}
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-text-light truncate group-hover:text-primary transition-colors">
                            {item.judul}
                          </p>
                        </div>
                        {/* Arrow */}
                        <ChevronRight
                          size={14}
                          className="text-text-muted/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </div>
                    </Link>
                  ))}
                </div>

                <MiniPagination
                  page={artikelPagination.page}
                  setPage={artikelPagination.setPage}
                  totalPages={artikelPagination.totalPages}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
