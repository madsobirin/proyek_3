"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { MessageCircleMore, X } from "lucide-react";
import ChatPanel, { PAGE_QUICK_PROMPTS } from "./ChatPanel";
import type { ChatPageContext } from "./ChatContext";
import Image from "next/image";

// Mapping pathname → nama halaman yang ditampilkan di badge FitBot
const PAGE_NAMES: Record<string, string> = {
  "/": "Beranda",
  "/kalkulator": "Kalkulator BMI",
  "/menu": "Menu Sehat",
  "/artikel": "Artikel",
  "/lokasi": "Lokasi Olahraga",
  "/scan-makanan": "Scan Makanan",
  "/profile": "Profil",
};

// Mapping pathname → key PAGE_QUICK_PROMPTS
const PATH_TO_KEY: Record<string, string> = {
  "/kalkulator": "kalkulator",
  "/menu": "menu",
  "/artikel": "artikel",
  "/lokasi": "lokasi",
  "/scan-makanan": "scan-makanan",
  "/profile": "profile",
};

export default function ChatButton() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  // Bangun pageContext otomatis berdasarkan pathname
  const pageContext = useMemo<ChatPageContext | null>(() => {
    const pageName = PAGE_NAMES[pathname] ?? null;
    const key = PATH_TO_KEY[pathname] ?? null;
    const quickPrompts = key ? PAGE_QUICK_PROMPTS[key] : null;
    if (!pageName && !quickPrompts) return null;
    return {
      pageName: pageName ?? "",
      quickPrompts: quickPrompts ?? [],
    };
  }, [pathname]);

  return (
    <>
      {/* Panel Chat */}
      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        isLoggedIn={isLoggedIn}
        pageContext={pageContext}
      />

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setOpen((p) => !p)}
          className={`relative p-4 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center group cursor-pointer ${
            open
              ? "bg-white dark:bg-[#0b2017] border border-primary/50 text-primary shadow-[0_0_20px_rgba(0,255,127,0.35)]"
              : "bg-primary hover:bg-primary-hover text-[#021f14] shadow-[0_0_24px_rgba(0,255,127,0.5)]"
          }`}
        >
          {open ? (
            <X size={22} className="transition-transform" />
          ) : (

          <Image
            src="/maskot-ai/first.png"
            alt="Maskot AI"
            width={30}
            height={30}
            className="group-hover:rotate-12 transition-transform"
          />
          )}

          {/* Ping animation saat belum dibuka */}
          {!open && (
            <span className="absolute -top-1 -right-1 w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
          )}
        </button>
      </div>
    </>
  );
}
