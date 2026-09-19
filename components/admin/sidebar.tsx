"use client";

import React from "react";
import {
  Home,
  Utensils,
  NotebookText,
  MapPin,
  Users,
  LogOut,
  X,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

interface SidebarItem {
  name: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", label: "Beranda", icon: Home, href: "/admin/dashboard" },
  {
    name: "Menu Sehat",
    label: "Menu Sehat",
    icon: Utensils,
    href: "/admin/menu",
  },
  {
    name: "Artikel",
    label: "Artikel",
    icon: NotebookText,
    href: "/admin/artikel",
  },
  {
    name: "Lokasi",
    label: "Lokasi Olahraga",
    icon: MapPin,
    href: "/admin/lokasi",
  },
  { name: "Pengguna", label: "Pengguna", icon: Users, href: "/admin/pengguna" },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const currentPath = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch {
      console.error("Logout gagal");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-100 flex flex-col p-6 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            {/* <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"> */}
            {/* <Zap className="w-5 h-5 text-white" /> */}
            <Image src="/logo.png" alt="logo" width={40} height={40} />
            {/* </div> */}
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              Fit<span className="text-emerald-500">Life</span>.id
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu label */}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
          Menu Utama
        </p>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== "/admin/dashboard" &&
                currentPath.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full group",
                  isActive
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white hover:shadow-sm",
                )}
              >
                <item.icon
                  className={clsx("w-5 h-5 shrink-0 transition-colors", {
                    "text-white": isActive,
                    "text-slate-400 group-hover:text-emerald-500": !isActive,
                  })}
                />
                <span>{item.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto pt-4 border-t border-slate-200 space-y-1">
          <Link
            href="/admin/profile"
            onClick={() => setIsOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full group",
              currentPath === "/admin/profile"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                : "text-slate-500 hover:text-slate-800 hover:bg-white hover:shadow-sm",
            )}
          >
            <div
              className={clsx(
                "w-5 h-5 rounded-full border-2 shrink-0 transition-colors",
                currentPath === "/admin/profile"
                  ? "border-white/70"
                  : "border-slate-300 group-hover:border-emerald-400",
              )}
            >
              <div
                className={clsx(
                  "w-full h-full rounded-full",
                  currentPath === "/admin/profile" ? "bg-white/30" : "",
                )}
              />
            </div>
            <span>Profil Saya</span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all w-full disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 shrink-0" />
            )}
            <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
