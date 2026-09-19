"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  Apple,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Flame,
  Loader2,
  LockKeyhole,
  PackageOpen,
  Play,
  ScanLine,
  Smartphone,
  Trash2,
} from "lucide-react";

type ScanMakanan = {
  id: number;
  barcode: string;
  nama_makanan: string;
  brand: string | null;
  image_url: string | null;
  kalori: number | null;
  protein: number | null;
  lemak: number | null;
  karbohidrat: number | null;
  gula: number | null;
  created_at: string | null;
};

type AuthState = "checking" | "guest" | "authenticated";

const mobileAppUrl = process.env.NEXT_PUBLIC_FITLIFE_MOBILE_APP_URL;
const androidAppUrl =
  process.env.NEXT_PUBLIC_FITLIFE_ANDROID_URL ?? mobileAppUrl;
const iosAppUrl = process.env.NEXT_PUBLIC_FITLIFE_IOS_URL ?? mobileAppUrl;

function formatNutrition(value: number | null, unit = "g") {
  if (value === null) return "—";
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value)}${unit}`;
}

function formatDate(value: string | null) {
  if (!value) return "Tanggal tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ScanMakananPage() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [history, setHistory] = useState<ScanMakanan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError(null);

    try {
      const response = await fetch("/api/scan-makanan");
      if (response.status === 401) {
        setAuthState("guest");
        return;
      }
      if (!response.ok) throw new Error("Tidak dapat memuat riwayat scan.");

      const result = await response.json();
      setHistory(Array.isArray(result.data) ? result.data : []);
    } catch {
      setError("Riwayat scan belum dapat dimuat. Coba beberapa saat lagi.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me");
        if (!active) return;

        if (!response.ok) {
          setAuthState("guest");
          return;
        }

        setAuthState("authenticated");
        await fetchHistory();
      } catch {
        if (active) setAuthState("guest");
      }
    }

    checkSession();
    return () => {
      active = false;
    };
  }, [fetchHistory]);

  const deleteHistory = async (id: number) => {
    if (!window.confirm("Hapus item ini dari riwayat scan?")) return;

    setDeletingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/scan-makanan?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      setHistory((items) => items.filter((item) => item.id !== id));
    } catch {
      setError("Riwayat scan tidak dapat dihapus. Silakan coba lagi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background-base">
      <section className="relative overflow-hidden border-b border-card-border bg-background-dark py-14 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-52 w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary">
            <ScanLine size={14} /> Riwayat Scan Makanan
          </div>
          <h1 className="mb-3 text-4xl font-black leading-tight text-text-light md:text-5xl">
            Pantau pilihan makan
            <span className="block text-transparent bg-clip-text bg-linear-to-r from-primary to-green-300">
              lebih mudah
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-text-muted">
            Scan produk melalui aplikasi FitLife di ponsel, lalu lihat riwayat
            dan nilai gizinya dari sini.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {authState === "checking" ? (
          <div className="flex min-h-72 items-center justify-center text-text-muted">
            <Loader2 className="mr-2 animate-spin text-primary" size={22} />
            Memeriksa sesi akun...
          </div>
        ) : authState === "guest" ? (
          <GuestState />
        ) : (
          <AuthenticatedHistory
            history={history}
            loading={loadingHistory}
            deletingId={deletingId}
            error={error}
            onRetry={fetchHistory}
            onDelete={deleteHistory}
          />
        )}
      </main>
    </div>
  );
}

function GuestState() {
  return (
    <section
      aria-label="Akses Riwayat Scan"
      className="mx-auto mb-16 max-w-4xl px-4 sm:px-6"
    >
      <div className="relative overflow-hidden rounded-3xl border border-card-border bg-card-dark p-6 shadow-2xl shadow-primary/5 transition-all duration-300 sm:p-9">
        <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 grid grid-cols-1 gap-8 divide-y divide-primary/15 md:grid-cols-2 md:gap-12 md:divide-x md:divide-y-0">
          <div className="flex flex-col justify-between pt-2 md:pr-6 md:pt-0">
            <div>
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-lg shadow-primary/10">
                <LockKeyhole size={24} />
              </div>
              <h2 className="text-2xl font-black leading-snug tracking-tight text-text-light">
                Masuk untuk melihat
                <br />
                riwayat scan Anda
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                Riwayat scan tersimpan aman di cloud FitLife. Masuk atau daftar
                untuk melihat detail kalori, gula, lemak, dan informasi gizi
                produk Anda.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-text-muted">
                <GuestFeature>
                  Sinkron otomatis dari aplikasi mobile FitLife
                </GuestFeature>
                <GuestFeature>Riwayat tersimpan aman di akun Anda</GuestFeature>
              </ul>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black tracking-wide text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:bg-primary-hover active:scale-95"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border border-primary/25 bg-background-dark/60 px-5 py-3 text-sm font-semibold text-text-light transition hover:border-primary/50 hover:text-primary"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between pt-8 md:pl-6 md:pt-0">
            <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Smartphone size={24} />
            </div>
            <h2 className="text-2xl font-black leading-snug tracking-tight text-text-light">
              Belum punya aplikasinya?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Scan barcode kemasan makanan dilakukan langsung lewat kamera
              ponsel Anda. Dapatkan informasi gizi produk secara instan.
            </p>
            <div className="mt-5 space-y-3 rounded-2xl border border-primary/15 bg-background-dark/50 p-4">
              <MobileStep number="1">
                <strong>Unduh aplikasi FitLife</strong> gratis di ponsel Anda.
              </MobileStep>
              <MobileStep number="2">
                <strong>Arahkan kamera ke barcode</strong> camilan, minuman,
                atau bahan masakan.
              </MobileStep>
              <MobileStep number="3">
                <strong>Informasi gizi muncul</strong> dan riwayat otomatis
                tampil di halaman ini setelah disimpan.
              </MobileStep>
            </div>
          </div>

          <div className="border-t border-primary/10 pt-4 md:col-span-2">
            <span className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-primary/80">
              Unduh Gratis Aplikasi FitLife
            </span>
            <div className="flex flex-wrap gap-2.5">
              <StoreButton
                href={androidAppUrl}
                platform="Google Play"
                icon={<Play size={20} />}
              />
              <StoreButton
                href={iosAppUrl}
                platform="App Store"
                icon={<Apple size={20} />}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuestFeature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Check size={15} className="shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}

function MobileStep({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-xs leading-relaxed text-text-muted">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-xs font-bold text-primary">
        {number}
      </span>
      <p>{children}</p>
    </div>
  );
}

function StoreButton({
  href,
  platform,
  icon,
}: {
  href: string | undefined;
  platform: string;
  icon: ReactNode;
}) {
  const contents = (
    <>
      <span className="text-primary transition-transform group-hover:scale-110">
        {icon}
      </span>
      <span>
        <span className="block text-[9px] uppercase leading-none text-text-muted">
          {href ? "Tersedia di" : "Segera hadir di"}
        </span>
        <span className="text-xs font-bold leading-tight text-text-light">
          {platform}
        </span>
      </span>
    </>
  );
  const className =
    "group inline-flex items-center gap-2.5 rounded-xl border border-primary/20 bg-background-dark/90 px-4 py-2.5 text-left transition hover:border-primary/40 hover:bg-background-dark";

  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {contents}
    </a>
  ) : (
    <span className={`${className} cursor-not-allowed opacity-65`}>
      {contents}
    </span>
  );
}

function AuthenticatedHistory({
  history,
  loading,
  deletingId,
  error,
  onRetry,
  onDelete,
}: {
  history: ScanMakanan[];
  loading: boolean;
  deletingId: number | null;
  error: string | null;
  onRetry: () => void;
  onDelete: (id: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-text-muted">
        <Loader2 className="mr-2 animate-spin text-primary" size={22} />
        Memuat riwayat scan...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <p className="mb-4 font-semibold text-text-light">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl border border-card-border px-4 py-2 text-sm font-bold text-text-light hover:border-primary hover:text-primary"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!history.length) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-dashed border-card-border bg-card-dark px-6 py-14 text-center sm:px-12">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Camera size={30} />
        </div>
        <h2 className="mb-3 text-2xl font-black text-text-light">
          Belum ada riwayat scan
        </h2>
        <p className="mx-auto max-w-md text-text-muted">
          Buka aplikasi FitLife di ponsel Anda, pindai produk makanan pertama,
          lalu simpan hasilnya ke riwayat akun ini.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-primary">
            Riwayat akun Anda
          </p>
          <h2 className="mt-1 text-2xl font-black text-text-light">
            Produk yang pernah dipindai
          </h2>
        </div>
        <p className="text-sm text-text-muted">
          {history.length} produk tersimpan
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {history.map((item) => (
          <article
            key={item.id}
            className="group overflow-hidden rounded-3xl border border-card-border bg-card-dark transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="relative flex h-48 items-center justify-center overflow-hidden bg-background-dark p-4">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.nama_makanan}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-contain p-4"
                />
              ) : (
                <PackageOpen size={45} className="text-primary/60" />
              )}
            </div>
            <div className="p-5">
              <div className="mb-4 flex gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black text-text-light">
                    {item.nama_makanan}
                  </h3>
                  <p className="truncate text-sm text-text-muted">
                    {item.brand || "Merek tidak tersedia"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-card-border text-text-muted transition hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Hapus ${item.nama_makanan} dari riwayat`}
                >
                  {deletingId === item.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                <NutritionBadge
                  icon={<Flame size={14} />}
                  label="Kalori"
                  value={formatNutrition(item.kalori, " kkal")}
                />
                <NutritionBadge
                  icon={<span>🥩</span>}
                  label="Protein"
                  value={formatNutrition(item.protein)}
                />
                <NutritionBadge
                  icon={<span>🧈</span>}
                  label="Lemak"
                  value={formatNutrition(item.lemak)}
                />
                <NutritionBadge
                  icon={<span>🌾</span>}
                  label="Karbo"
                  value={formatNutrition(item.karbohidrat)}
                />
              </div>
              <div className="flex items-center gap-1.5 border-t border-card-border pt-3 text-xs text-text-muted">
                <CalendarDays size={13} /> {formatDate(item.created_at)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function NutritionBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-background-base px-3 py-2">
      <div className="mb-0.5 flex items-center gap-1 text-primary">{icon}</div>
      <p className="text-text-muted">{label}</p>
      <p className="font-bold text-text-light">{value}</p>
    </div>
  );
}
