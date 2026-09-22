"use client";

import { useEffect, useState, useCallback} from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  Clock,
  Shield,
  Loader2,
  Share2,
  Heart,
  TrendingUp,
  ChevronRight,
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
  gambar: string;
  created_at: string;
};

const STATUS_CONFIG: Record<
  TargetStatus,
  { color: string; bg: string; border: string }
> = {
  Kurus: {
    color: "text-blue-300",
    bg: "bg-blue-500/20",
    border: "border-blue-500/40",
  },
  Normal: {
    color: "text-primary",
    bg: "bg-primary/20",
    border: "border-primary/40",
  },
  Berlebih: {
    color: "text-yellow-300",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/40",
  },
  Obesitas: {
    color: "text-red-300",
    bg: "bg-red-500/20",
    border: "border-red-500/40",
  },
};

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [related, setRelated] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch(`/api/menus/${slug}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data: Menu = await res.json();
        setMenu(data);

        // Increment dibaca 1x
        // if (!hasTracked.current) {
        //   hasTracked.current = true;
        //   fetch(`/api/menus/${slug}`, { method: "PATCH" })
        //     .then(() => {
        //       setMenu((prev) =>
        //         prev ? { ...prev, dibaca: (prev.dibaca ?? 0) + 1 } : prev,
        //       );
        //     })
        //     .catch(() => {});
        // }

        // Fetch related by target_status
        const relRes = await fetch(`/api/menus?target=${data.target_status}`);
        if (relRes.ok) {
          const relData: Menu[] = await relRes.json();
          setRelated(relData.filter((m) => m.slug !== slug).slice(0, 3));
        }
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* silent */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-text-muted text-sm">Memuat menu...</p>
        </div>
      </div>
    );
  }

  if (notFound || !menu) {
    return (
      <div className="min-h-screen bg-background-base flex flex-col items-center justify-center gap-4">
        <p className="text-text-light font-bold text-lg">
          Menu tidak ditemukan
        </p>
        <Link
          href="/menu"
          className="text-primary text-sm font-semibold hover:underline"
        >
          ← Kembali ke Menu Sehat
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[menu.target_status];

  return (
    <div className="min-h-screen bg-background-base">
      {/* ── Back button ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm font-semibold group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Kembali
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        {/* ── Main Card ── */}
        <div className="bg-card-dark border border-card-border rounded-3xl overflow-hidden shadow-2xl">
          {/* Hero Image */}
          <div className="relative h-72 md:h-[420px] overflow-hidden">
            <Image
              src={menu.gambar}
              alt={menu.nama_menu}
              fill
              className="object-cover"
              priority
              unoptimized
            />
            {/* Gradient overlay bottom */}
            <div className="absolute inset-0 bg-linear-to-t from-card-dark via-card-dark/20 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="bg-primary text-background-dark text-[10px] font-black px-3 py-1 rounded-full tracking-wider flex items-center gap-1">
                <Shield size={9} className="fill-background-dark" /> PREMIUM
              </span>
              <span
                className={`text-[10px] font-black px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
              >
                {menu.target_status.toUpperCase()}
              </span>
            </div>

            {/* Views
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-background-dark/60 backdrop-blur-sm border border-card-border px-2.5 py-1 rounded-full text-xs text-text-muted">
              <Eye size={11} />
              {menu.dibaca ?? 0}
            </div> */}

            {/* Stats overlay — bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 flex items-end justify-between">
              <div className="flex items-center gap-3">
                {/* Kalori badge */}
                <div className="flex items-center gap-2.5 bg-background-dark/80 backdrop-blur-sm border border-card-border rounded-2xl px-4 py-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                    <Flame size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none mb-0.5">
                      Kalori
                    </p>
                    <p className="text-base font-black text-text-light leading-none">
                      {menu.kalori}{" "}
                      <span className="text-xs font-bold text-text-muted">
                        kkal
                      </span>
                    </p>
                  </div>
                </div>

                {/* Waktu badge */}
                <div className="flex items-center gap-2.5 bg-background-dark/80 backdrop-blur-sm border border-card-border rounded-2xl px-4 py-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Clock size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none mb-0.5">
                      Waktu
                    </p>
                    <p className="text-base font-black text-text-light leading-none">
                      {menu.waktu_memasak}{" "}
                      <span className="text-xs font-bold text-text-muted">
                        mnt
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 md:px-8 py-8">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-black text-text-light leading-tight mb-6">
              {menu.nama_menu}
            </h1>

            {/* Cara Menyiapkan */}
            <div className="mb-8">
              <h2 className="text-base font-black text-text-light mb-3">
                Cara Menyiapkan Menu Ini
              </h2>
              <p className="text-text-muted text-sm leading-relaxed">
                {menu.deskripsi}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-card-border mb-6" />

            {/* Action bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-sm font-semibold">
                  Bagikan:
                </span>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                    shared
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-background-base border-card-border text-text-muted hover:border-primary/40 hover:text-primary"
                  }`}
                  title={shared ? "Link disalin!" : "Bagikan"}
                >
                  <Share2 size={15} />
                </button>

                {/* Like */}
                <button
                  onClick={() => setLiked((p) => !p)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                    liked
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-background-base border-card-border text-text-muted hover:border-red-400/40 hover:text-red-400"
                  }`}
                  title={liked ? "Hapus dari favorit" : "Tambah ke favorit"}
                >
                  <Heart size={15} className={liked ? "fill-red-400" : ""} />
                </button>
              </div>

              {/* BMI CTA */}
              <Link
                href="/kalkulator"
                className="flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary px-4 py-2 rounded-xl text-xs font-black hover:bg-primary/20 transition-all group"
              >
                Cocokkan dengan BMI Anda
                <TrendingUp
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Nutrisi Info Card ── */}
        <div className="mt-4 bg-card-dark border border-card-border rounded-2xl p-6">
          <h3 className="text-sm font-black text-text-light mb-4">
            Info Nutrisi
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Kalori",
                value: `${menu.kalori} kkal`,
                icon: <Flame size={14} className="text-orange-400" />,
                bg: "bg-orange-500/10 border-orange-500/20",
              },
              {
                label: "Waktu Masak",
                value: `${menu.waktu_memasak} menit`,
                icon: <Clock size={14} className="text-primary" />,
                bg: "bg-primary/10 border-primary/20",
              },
              {
                label: "Target",
                value: menu.target_status,
                icon: <Shield size={14} className={statusCfg.color} />,
                bg: `${statusCfg.bg} ${statusCfg.border}`,
              },
              // {
              //   label: "Dilihat",
              //   value: `${menu.dibaca ?? 0}x`,
              //   icon: <Eye size={14} className="text-text-muted" />,
              //   bg: "bg-background-base border-card-border",
              // },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 p-3 rounded-xl border ${item.bg}`}
              >
                <div className="shrink-0">{item.icon}</div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                    {item.label}
                  </p>
                  <p className="text-sm font-black text-text-light">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Related Menus ── */}
        {related.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-lg font-black text-text-light">
                  Menu Serupa
                </h2>
              </div>
              <Link
                href="/menu"
                className="text-primary text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
              >
                Lihat semua <ChevronRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link key={item.id} href={`/menu/${item.slug}`}>
                  <div className="group bg-card-dark border border-card-border rounded-2xl overflow-hidden hover:border-primary/25 transition-all hover:-translate-y-0.5">
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={item.gambar}
                        alt={item.nama_menu}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-card-dark/80 to-transparent" />
                      <span className="absolute bottom-2 right-2 bg-primary text-background-dark text-[9px] font-black px-2 py-0.5 rounded-full">
                        PREMIUM
                      </span>
                    </div>
                    <div className="p-3.5">
                      <h3 className="text-sm font-black text-text-light line-clamp-1 group-hover:text-primary transition-colors mb-1.5">
                        {item.nama_menu}
                      </h3>
                      <div className="flex items-center gap-2.5 text-[11px] text-text-muted">
                        <span className="flex items-center gap-1">
                          <Flame size={10} className="text-orange-400" />{" "}
                          {item.kalori} kkal
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} className="text-primary/70" />{" "}
                          {item.waktu_memasak}m
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
