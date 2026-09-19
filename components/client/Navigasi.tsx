"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Sun, Moon, X, MapPin, ScanLine } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NavProfile from "../NavProfile";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <nav className="sticky top-0 z-[1010] bg-background-base/90 backdrop-blur-md border-b border-card-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="Logo" width={35} height={35} />
            <span className="font-bold text-2xl tracking-tight text-text-light">
              FitLife<span className="text-primary">.id</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link
              href="/"
              className={`text-text-light hover:text-primary font-medium transition-colors ${pathname === "/" ? "text-primary" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/kalkulator"
              className={`text-text-muted hover:text-primary font-medium transition-colors ${pathname === "/kalkulator" ? "text-primary" : ""}`}
            >
              Kalkulator BMI
            </Link>
            <Link
              href="/menu"
              className={`text-text-muted hover:text-primary font-medium transition-colors ${pathname === "/menu" ? "text-primary" : ""}`}
            >
              Menu Sehat
            </Link>
            <Link
              href="/artikel"
              className={`text-text-muted hover:text-primary font-medium transition-colors ${pathname === "/artikel" ? "text-primary" : ""}`}
            >
              Artikel
            </Link>
            <Link
              href="/lokasi"
              className={`text-text-muted hover:text-primary font-medium transition-colors flex items-center gap-1 ${pathname === "/lokasi" ? "text-primary" : ""}`}
            >
              {/* <MapPin size={14} /> */}
              Lokasi
            </Link>
            <Link
              href="/scan-makanan"
              className={`text-text-muted hover:text-primary font-medium transition-colors flex items-center gap-1 ${pathname === "/scan-makanan" ? "text-primary" : ""}`}
            >
              <ScanLine size={15} /> Riwayat Scan
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full border border-card-border hover:border-primary text-text-muted hover:text-primary transition-all duration-300 hover:shadow-[0_0_12px_rgba(0,255,127,0.2)]"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            <NavProfile />
          </div>

          {/* Mobile: Theme Toggle + Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full border border-card-border text-text-muted hover:text-primary transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-text-light hover:text-primary focus:outline-none transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileOpen && (
          <div className="md:hidden pb-6 border-t border-card-border pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <Link
              href="/"
              className="block text-text-light hover:text-primary font-medium transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/kalkulator"
              className="block text-text-muted hover:text-primary font-medium transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              Kalkulator BMI
            </Link>
            <Link
              href="/menu"
              className="block text-text-muted hover:text-primary font-medium transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              Menu Sehat
            </Link>
            <Link
              href="/artikel"
              className="block text-text-muted hover:text-primary font-medium transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              Artikel
            </Link>
            <Link
              href="/lokasi"
              className="block text-text-muted hover:text-primary font-medium transition-colors py-2 flex items-center gap-1.5"
              onClick={() => setMobileOpen(false)}
            >
              <MapPin size={14} /> Lokasi Olahraga
            </Link>
            <Link
              href="/scan-makanan"
              className="block text-text-muted hover:text-primary font-medium transition-colors py-2 flex items-center gap-1.5"
              onClick={() => setMobileOpen(false)}
            >
              <ScanLine size={14} /> Riwayat Scan
            </Link>
            <NavProfile />
          </div>
        )}
      </div>
    </nav>
  );
}
