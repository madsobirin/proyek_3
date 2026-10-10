"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User, ChevronDown, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type UserData = {
  id: number;
  name: string;
  email: string;
  role: string;
  photo?: string | null; // ← tambah
  google_avatar?: string | null;
};

export default function NavProfile() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Angkat fetchUser ke luar useEffect
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Listen event dari ProfilePage setelah upload sukses
    window.addEventListener("profile:updated", fetchUser);
    return () => window.removeEventListener("profile:updated", fetchUser);
  }, [fetchUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        setOpen(false);
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="hidden md:block w-9 h-9 rounded-full bg-card-dark border border-card-border animate-pulse" />
        <div className="md:hidden w-full h-14 rounded-2xl bg-card-dark border border-card-border animate-pulse mt-2" />
      </>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-2.5 rounded-full font-bold shadow-xs transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full md:w-auto"
      >
        <LogIn size={18} />
        <span>Login</span>
      </Link>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const avatarSrc = user.photo || user.google_avatar || null;

  const AvatarImage = ({ size }: { size: number }) => (
    <div
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden border-2 border-primary/40 flex items-center justify-center bg-primary/10 text-primary font-bold select-none shrink-0"
    >
      {avatarSrc ? (
        <Image
          src={avatarSrc}
          alt={user.name ?? "Avatar"}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span style={{ fontSize: size * 0.35 }}>{initials}</span>
      )}
    </div>
  );

  return (
    <>
      {/* ── DESKTOP: dropdown ── */}
      <div className="relative hidden md:block" ref={dropdownRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 group"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <AvatarImage size={36} />
          <span className="text-sm font-semibold text-text-light max-w-[100px] truncate">
            {user.name?.split(" ")[0]}
          </span>
          <ChevronDown
            size={14}
            className={`text-text-muted transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-58 rounded-2xl border border-card-border bg-card-dark shadow-xl z-50 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

            <div className="px-4 py-3.5 border-b border-card-border bg-background-base/40">
              <div className="flex items-center gap-3">
                <AvatarImage size={36} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-light truncate leading-tight">
                    {user.name}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              {user.role === "admin" && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={11} /> Admin
                </span>
              )}
            </div>

            <div className="py-1.5">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted hover:text-text-light hover:bg-background-base/60 transition-colors group/item"
              >
                <User
                  size={15}
                  className="text-primary/60 group-hover/item:text-primary transition-colors"
                />
                <span>Profil Saya</span>
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted hover:text-text-light hover:bg-background-base/60 transition-colors group/item"
                >
                  <ShieldCheck
                    size={15}
                    className="text-primary/60 group-hover/item:text-primary transition-colors"
                  />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>

            <div className="border-t border-card-border py-1.5">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-40 group/logout"
              >
                <LogOut
                  size={15}
                  className="group-hover/logout:text-red-400 transition-colors"
                />
                <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE: inline card ── */}
      <div className="md:hidden mt-2 border-t border-card-border pt-4">
        <div className="flex items-center gap-3 px-1 py-2 mb-3">
          <AvatarImage size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-light truncate">
              {user.name}
            </p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
          {user.role === "admin" && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              <ShieldCheck size={10} /> Admin
            </span>
          )}
        </div>

        <div className="space-y-1">
          <Link
            href="/profile"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-light hover:bg-card-dark transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <User size={15} className="text-primary" />
            </div>
            <span className="font-medium">Profil Saya</span>
          </Link>

          {user.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-light hover:bg-card-dark transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <ShieldCheck size={15} className="text-primary" />
              </div>
              <span className="font-medium">Admin Dashboard</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-40 group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/15 transition-colors">
              <LogOut size={15} className="text-red-400" />
            </div>
            <span className="font-medium">
              {loggingOut ? "Keluar..." : "Keluar"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
