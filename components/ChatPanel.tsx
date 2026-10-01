"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import { toast } from "sonner";
import {
  Bot,
  Send,
  Sparkles,
  X,
  Scale,
  Utensils,
  Heart,
  RefreshCw,
  LogIn,
  RotateCcw,
  MapPin,
  ScanLine,
  BookOpen,
  User,
  Dumbbell,
  Home,
  MessageSquare,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Search,
  Activity,
  Flame,
  Clock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import type { ChatPageContext } from "./ChatContext";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
};

type TabType = "home" | "messages" | "help";

type HealthSummary = {
  name: string | null;
  height: number | null;
  weight: number | null;
  latestBmi?: {
    bmi: number;
    status: string;
    tdee?: number;
    created_at?: string;
  } | null;
};

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

const DEFAULT_QUICK_PROMPTS = [
  { icon: <Scale size={13} />, text: "Cek tinggi & berat badan" },
  { icon: <Heart size={13} />, text: "Status BMI terakhir" },
  { icon: <Sparkles size={13} />, text: "Hitung kalori harian" },
  { icon: <Utensils size={13} />, text: "Rekomendasi menu diet" },
];

export const PAGE_QUICK_PROMPTS: Record<
  string,
  { icon: React.ReactNode; text: string }[]
> = {
  kalkulator: [
    { icon: <Scale size={13} />, text: "Jelaskan hasil BMI saya" },
    { icon: <Dumbbell size={13} />, text: "Program latihan untuk BMI saya" },
    { icon: <Utensils size={13} />, text: "Pola makan sesuai BMI saya" },
    { icon: <Sparkles size={13} />, text: "Hitung kalori harian" },
  ],
  menu: [
    { icon: <Utensils size={13} />, text: "Menu rendah kalori untuk diet" },
    { icon: <Heart size={13} />, text: "Makanan tinggi protein" },
    { icon: <Sparkles size={13} />, text: "Rekomendasi menu untuk BMI saya" },
    { icon: <Scale size={13} />, text: "Hitung kalori harian saya" },
  ],
  artikel: [
    { icon: <BookOpen size={13} />, text: "Tips hidup sehat sehari-hari" },
    { icon: <Heart size={13} />, text: "Cara menjaga berat badan ideal" },
    { icon: <Dumbbell size={13} />, text: "Olahraga untuk pemula" },
    { icon: <Utensils size={13} />, text: "Pola makan sehat" },
  ],
  lokasi: [
    { icon: <MapPin size={13} />, text: "Olahraga yang cocok untuk saya" },
    { icon: <Dumbbell size={13} />, text: "Manfaat gym vs olahraga outdoor" },
    { icon: <Heart size={13} />, text: "Frekuensi olahraga ideal per minggu" },
    { icon: <Sparkles size={13} />, text: "Tips memulai rutin olahraga" },
  ],
  "scan-makanan": [
    { icon: <ScanLine size={13} />, text: "Cara membaca label nutrisi" },
    { icon: <Utensils size={13} />, text: "Batas kalori aman per hari" },
    { icon: <Heart size={13} />, text: "Makanan ultra-proses vs alami" },
    { icon: <Scale size={13} />, text: "Status BMI terakhir" },
  ],
  profile: [
    { icon: <User size={13} />, text: "Cek tinggi & berat badan" },
    { icon: <Scale size={13} />, text: "Status BMI terakhir" },
    { icon: <Sparkles size={13} />, text: "Hitung kalori harian" },
    { icon: <Heart size={13} />, text: "Tips menjaga kesehatan" },
  ],
};

const FAQ_ITEMS = [
  {
    id: "faq-bmi",
    category: "Kalkulator & Tubuh",
    question: "Bagaimana cara membaca status BMI & kategori berat badan?",
    answer:
      "Skor BMI dihitung dari Berat Badan (kg) dibagi kuadrat Tinggi Badan (m). Kategori menurut standar kesehatan: Kurang (< 18.5), Normal/Ideal (18.5 - 24.9), Berlebih (25.0 - 29.9), dan Obesitas (>= 30.0).",
    prompt: "Jelaskan cara membaca skor BMI dan langkah yang harus diambil",
  },
  {
    id: "faq-bmr",
    category: "Kalkulator & Tubuh",
    question: "Apa bedanya BMR dengan TDEE dalam penghitungan kalori?",
    answer:
      "BMR (Basal Metabolic Rate) adalah kalori minimum yang dibutuhkan tubuh saat istirahat total untuk fungsi organ vital. Sedangkan TDEE (Total Daily Energy Expenditure) adalah total kalori yang dibakar termasuk aktivitas fisik harian.",
    prompt: "Jelaskan perbedaan BMR dan TDEE secara detail",
  },
  {
    id: "faq-defisit",
    category: "Nutrisi & Diet",
    question: "Berapa defisit kalori harian yang aman untuk menurunkan BB?",
    answer:
      "Defisit kalori yang direkomendasikan secara medis adalah 300 - 500 kkal di bawah TDEE Anda. Hal ini memungkinkan penurunan berat badan bertahap sekitar 0.5 - 1 kg per minggu tanpa merusak metabolisme atau kehilangan massa otot.",
    prompt: "Berapa target defisit kalori harian yang aman untuk saya?",
  },
  {
    id: "faq-protein",
    category: "Nutrisi & Diet",
    question: "Berapa kebutuhan protein harian untuk tubuh?",
    answer:
      "Rata-rata orang dewasa memerlukan 1.2 hingga 1.6 gram protein per kg berat badan untuk menjaga massa otot, dan hingga 2.0 gram per kg bagi yang aktif berolahraga intensif.",
    prompt: "Berapa kebutuhan protein harian ideal untuk berat badan saya?",
  },
  {
    id: "faq-olahraga",
    category: "Aktivitas Fisik",
    question: "Olahraga apa yang aman untuk kategori Berlebih atau Obesitas?",
    answer:
      "Latihan berintensitas rendah (*Low Impact*) seperti jalan cepat, berenang, dan bersepeda statis sangat aman karena meminimalkan beban benturan pada persendian lutut dan tumit.",
    prompt: "Rekomendasi jenis olahraga aman untuk kategori berat badan berlebih",
  },
  {
    id: "faq-scan",
    category: "Fitur Scan",
    question: "Bagaimana cara menggunakan fitur Scan Makanan?",
    answer:
      "Buka menu Scan Makanan, arahkan kamera ke barcode kemasan produk makanan. FitLife akan membaca data nutrisi resmi dari Open Food Facts dan menampilkan kalori, protein, lemak, dan karbohidrat secara instan.",
    prompt: "Cara menggunakan fitur scan barcode makanan di FitLife",
  },
];

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-sm font-bold text-text-light mt-2.5 mb-1 pb-0.5 border-b border-card-border first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xs font-bold text-text-light mt-2 mb-1 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold text-text-light mt-1.5 mb-0.5 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-1.5 last:mb-0 leading-relaxed text-text-muted">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-4 space-y-0.5 my-1.5 text-text-muted">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 space-y-0.5 my-1.5 text-text-muted">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed pl-0.5">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-text-light">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-text-muted">{children}</em>
  ),
  code: ({ children }) => (
    <code className="bg-background-dark/80 text-primary px-1.5 py-0.5 rounded text-[11px] font-mono border border-card-border">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-background-dark/90 text-text-light p-2.5 rounded-xl overflow-x-auto text-[11px] font-mono border border-card-border my-1.5 [&>code]:bg-transparent [&>code]:p-0 [&>code]:border-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/60 pl-2.5 my-1.5 italic text-text-muted bg-primary/5 py-0.5 rounded-r">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline hover:text-primary-hover font-medium transition-colors"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="border-card-border my-2" />,
};

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Halo! Saya FitBot, asisten kesehatan Anda. Saya siap membantu pertanyaan seputar diet, nutrisi, olahraga, dan gaya hidup sehat. Ada yang bisa saya bantu? 😊",
  timestamp: new Date(),
};

export default function ChatPanel({
  open,
  onClose,
  isLoggedIn,
  pageContext,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  pageContext?: ChatPageContext | null;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [searchHelp, setSearchHelp] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick prompts aktif
  const activeQuickPrompts =
    pageContext?.quickPrompts && pageContext.quickPrompts.length > 0
      ? pageContext.quickPrompts
      : DEFAULT_QUICK_PROMPTS;

  // Ambil ringkasan profil & BMI user saat modal dibuka
  useEffect(() => {
    if (!open || !isLoggedIn) return;

    // Fetch data user profil & perhitungan terakhir
    Promise.all([
      fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/perhitungan")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([userData, historyData]) => {
      const user = userData?.user;
      const historyList = Array.isArray(historyData)
        ? historyData
        : historyData?.history || [];
      const latestBmi = historyList?.[0] ?? null;

      if (user) {
        setHealthSummary({
          name: user.name || user.username || "Sobat FitLife",
          height: user.height || latestBmi?.tinggi_badan || null,
          weight: user.weight || latestBmi?.berat_badan || null,
          latestBmi: latestBmi
            ? {
                bmi: latestBmi.bmi,
                status: latestBmi.status,
                tdee: latestBmi.tdee,
                created_at: latestBmi.created_at,
              }
            : null,
        });
      }
    });
  }, [open, isLoggedIn]);

  // Focus input ketika tab Messages aktif
  useEffect(() => {
    if (open && activeTab === "messages") {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open, activeTab]);

  useEffect(() => {
    if (activeTab === "messages") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing, activeTab]);

  const handleResetChat = () => {
    if (typing) return;
    setMessages([
      {
        ...INITIAL_MESSAGE,
        timestamp: new Date(),
      },
    ]);
    setInput("");
    toast.success("Obrolan baru dimulai. Riwayat percakapan telah di-reset.");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || typing) return;

    // Pastikan langsung switch ke tab messages jika dipanggil dari tab lain
    if (activeTab !== "messages") {
      setActiveTab("messages");
    }

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const chatHistory = [
        ...messages.filter((m) => m.id !== "welcome"),
        userMsg,
      ]
        .slice(-4)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content:
              data?.error ||
              "Maaf, server AI sedang sibuk. Silakan coba lagi.",
            timestamp: new Date(),
            isError: true,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "Koneksi terputus. Pastikan internet aktif.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    }

    setTyping(false);
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    setMessages((prev) => prev.filter((m) => !m.isError));
    sendMessage(lastUserMsg.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  // Filter FAQ untuk tab Help
  const filteredFaqs = useMemo(() => {
    if (!searchHelp.trim()) return FAQ_ITEMS;
    const q = searchHelp.toLowerCase();
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [searchHelp]);

  // Pesan terakhir untuk cuplikan di Tab Home
  const lastMessage = useMemo(() => {
    if (messages.length <= 1) return null;
    return messages[messages.length - 1];
  }, [messages]);

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-background-dark/40 backdrop-blur-sm z-1040 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel Utama */}
      <div
        className={`fixed z-1050 transition-all duration-300 ease-out
          bottom-20 right-4
          w-[calc(100vw-2rem)] max-w-[420px]
          md:bottom-24 md:right-6 md:w-[410px]
          ${
            open
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
      >
        <div className="bg-background-dark border border-card-border rounded-3xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col h-[610px] max-h-[85vh]">
          
          {/* ───────────────────────────────────────────────────────────── */}
          {/* KONTEN BERDASARKAN TAB AKTIF */}
          {/* ───────────────────────────────────────────────────────────── */}

          {/* JIKA BELUM LOGIN */}
          {!isLoggedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center bg-accent">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <LogIn size={28} className="text-primary" />
              </div>
              <h3 className="text-sm font-bold text-text-light mb-2">
                Login Diperlukan
              </h3>
              <p className="text-xs text-text-muted leading-relaxed mb-5">
                Silakan login terlebih dahulu untuk menggunakan asisten FitBot
                dan mendapatkan rekomendasi kesehatan personal.
              </p>
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-background-dark text-xs font-bold hover:bg-primary-hover transition-all shadow-[0_0_12px_rgba(0,255,127,0.3)] hover:shadow-[0_0_18px_rgba(0,255,127,0.5)]"
              >
                <LogIn size={14} />
                Login Sekarang
              </Link>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* TAB 1: HOME (Self-Service Health Hub) */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeTab === "home" && (
                <div className="flex-1 flex flex-col overflow-hidden bg-accent">
                  {/* Home Header */}
                  <div className="relative px-5 pt-5 pb-4 border-b border-card-border bg-card-dark/90 shrink-0">
                    <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                          <Bot size={18} className="text-primary" />
                        </div>
                        <span className="text-xs font-black text-text-light">
                          FitLife AI Hub
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          Online
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        title="Tutup Panel"
                        className="p-1.5 rounded-xl text-text-muted hover:text-text-light hover:bg-background-base/50 transition-all cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <h2 className="text-base font-extrabold text-text-light">
                      Halo, {healthSummary?.name || "Sobat FitLife"}! 👋
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Pusat layanan mandiri & asisten pintar kesehatan Anda.
                    </p>
                  </div>

                  {/* Home Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 scrollbar-thin">
                    
                    {/* Card 1: Lanjutkan Percakapan / Recent Message */}
                    <div className="bg-card-dark border border-card-border rounded-2xl p-3.5 shadow-sm hover:border-primary/40 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                          <MessageSquare size={13} />
                          {lastMessage ? "Lanjutkan Obrolan" : "Mulai Percakapan"}
                        </span>
                        {lastMessage && (
                          <span className="text-[10px] text-text-muted">
                            {formatTime(lastMessage.timestamp)}
                          </span>
                        )}
                      </div>

                      {lastMessage ? (
                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-3">
                          {lastMessage.role === "assistant" ? "FitBot: " : "Anda: "}
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-text-muted leading-relaxed mb-3">
                          Tanyakan pertanyaan seputar nutrisi, diet, atau panduan olahraga dengan FitBot AI.
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("messages")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-background-dark text-xs font-bold hover:bg-primary-hover transition-all shadow-[0_0_10px_rgba(0,255,127,0.2)]"
                        >
                          <span>{lastMessage ? "Buka Obrolan" : "Kirim Pesan"}</span>
                          <ChevronRight size={14} />
                        </button>
                        {lastMessage && (
                          <button
                            type="button"
                            onClick={handleResetChat}
                            title="Mulai obrolan baru dari awal"
                            className="p-2 rounded-xl bg-background-base/60 border border-card-border hover:border-primary/40 text-text-muted hover:text-primary transition-all"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Status Metrik Kesehatan (Realtime DB) */}
                    <div className="bg-card-dark border border-card-border rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-bold text-text-light flex items-center gap-1.5">
                          <Activity size={13} className="text-primary" />
                          Status Metrik Kesehatan
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          Terhubung
                        </span>
                      </div>

                      {healthSummary?.latestBmi ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-left">
                            <div className="bg-background-dark/60 border border-card-border rounded-xl p-2">
                              <p className="text-[10px] text-text-muted">Status BMI</p>
                              <p className="text-xs font-bold text-primary mt-0.5">
                                {healthSummary.latestBmi.bmi.toFixed(1)} • {healthSummary.latestBmi.status}
                              </p>
                            </div>
                            <div className="bg-background-dark/60 border border-card-border rounded-xl p-2">
                              <p className="text-[10px] text-text-muted">TB / BB</p>
                              <p className="text-xs font-bold text-text-light mt-0.5">
                                {healthSummary.height || "-"} cm / {healthSummary.weight || "-"} kg
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => sendMessage("Jelaskan hasil status BMI terakhir saya dan tipsnya")}
                            className="w-full text-center text-[11px] text-primary hover:text-primary-hover font-semibold py-1 transition-colors flex items-center justify-center gap-1"
                          >
                            <Sparkles size={11} /> Konsultasikan hasil ini dengan AI
                          </button>
                        </div>
                      ) : (
                        <div className="text-left bg-background-dark/50 border border-card-border rounded-xl p-2.5">
                          <p className="text-xs text-text-muted leading-relaxed mb-2">
                            Belum ada catatan BMI terbaru. Hitung BMI Anda untuk melihat rekomendasi personal.
                          </p>
                          <Link
                            href="/kalkulator"
                            onClick={onClose}
                            className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                          >
                            Hitung Sekarang <ExternalLink size={12} />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Card 3: Quick Questions / Pintasan Cepat */}
                    <div className="bg-card-dark border border-card-border rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-text-light flex items-center gap-1.5">
                          <Sparkles size={13} className="text-primary" />
                          Pintasan Cepat {pageContext?.pageName ? `(${pageContext.pageName})` : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {activeQuickPrompts.map((q) => (
                          <button
                            key={q.text}
                            type="button"
                            onClick={() => sendMessage(q.text)}
                            className="flex items-center justify-between text-left p-2.5 rounded-xl bg-background-dark/70 border border-card-border text-text-muted hover:border-primary/40 hover:text-text-light hover:bg-card-border/20 transition-all text-xs group"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-primary">{q.icon}</span>
                              <span className="font-medium text-[11px]">{q.text}</span>
                            </span>
                            <ChevronRight
                              size={13}
                              className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card 4: Navigasi Fitur FitLife */}
                    <div className="bg-card-dark border border-card-border rounded-2xl p-3.5 shadow-sm">
                      <p className="text-[11px] font-bold text-text-light mb-2">
                        Jelajahi Fitur FitLife
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-left">
                        <Link
                          href="/kalkulator"
                          onClick={onClose}
                          className="flex items-center gap-2 p-2 rounded-xl bg-background-dark/60 border border-card-border hover:border-primary/40 text-text-muted hover:text-primary text-[11px] font-medium transition-all"
                        >
                          <Scale size={13} className="text-primary shrink-0" />
                          <span className="truncate">Kalkulator BMI</span>
                        </Link>
                        <Link
                          href="/menu"
                          onClick={onClose}
                          className="flex items-center gap-2 p-2 rounded-xl bg-background-dark/60 border border-card-border hover:border-primary/40 text-text-muted hover:text-primary text-[11px] font-medium transition-all"
                        >
                          <Utensils size={13} className="text-primary shrink-0" />
                          <span className="truncate">Menu Sehat</span>
                        </Link>
                        <Link
                          href="/lokasi"
                          onClick={onClose}
                          className="flex items-center gap-2 p-2 rounded-xl bg-background-dark/60 border border-card-border hover:border-primary/40 text-text-muted hover:text-primary text-[11px] font-medium transition-all"
                        >
                          <MapPin size={13} className="text-primary shrink-0" />
                          <span className="truncate">Peta Olahraga</span>
                        </Link>
                        <Link
                          href="/scan-makanan"
                          onClick={onClose}
                          className="flex items-center gap-2 p-2 rounded-xl bg-background-dark/60 border border-card-border hover:border-primary/40 text-text-muted hover:text-primary text-[11px] font-medium transition-all"
                        >
                          <ScanLine size={13} className="text-primary shrink-0" />
                          <span className="truncate">Scan Makanan</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* TAB 2: MESSAGES (Interaksi Chat Aktif) */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeTab === "messages" && (
                <div className="flex-1 flex flex-col overflow-hidden bg-accent">
                  {/* Messages Header */}
                  <div className="relative px-4 py-3 border-b border-card-border bg-card-dark/90 shrink-0">
                    <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab("home")}
                        title="Kembali ke Hub"
                        className="p-1 rounded-lg text-text-muted hover:text-text-light hover:bg-background-base/50 transition-all cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                      </button>

                      {/* Bot Avatar */}
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                          <Bot size={18} className="text-primary" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background-dark shadow-[0_0_6px_rgba(0,255,127,0.6)]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-black text-text-light">FitBot</p>
                          <span className="flex items-center gap-0.5 text-[9px] text-primary font-bold bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full">
                            <Sparkles size={8} className="fill-primary" /> AI Health
                          </span>
                          {pageContext?.pageName && (
                            <span className="text-[9px] text-text-muted/70 bg-card-border/30 border border-card-border px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
                              📍 {pageContext.pageName}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted">
                          {typing ? (
                            <span className="text-primary animate-pulse">
                              Sedang mengetik...
                            </span>
                          ) : (
                            "Asisten kesehatan & nutrisi"
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={handleResetChat}
                          disabled={typing || messages.length <= 1}
                          title="Hapus Chat / Obrolan Baru"
                          aria-label="Hapus Chat / Obrolan Baru"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-text-muted hover:text-primary hover:bg-primary/10 border border-card-border hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none group cursor-pointer"
                        >
                          <RotateCcw
                            size={11}
                            className="text-primary group-hover:-rotate-90 transition-transform duration-300"
                          />
                          <span className="hidden min-[360px]:inline">Reset</span>
                        </button>

                        <button
                          type="button"
                          onClick={onClose}
                          title="Tutup Panel"
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-light hover:bg-background-base/50 transition-all cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 scrollbar-thin bg-accent">
                    {/* Info Notice Banner */}
                    <div className="text-center py-1">
                      <span className="inline-block text-[10px] text-text-muted/60 bg-background-dark/50 border border-card-border px-3 py-1 rounded-full">
                        🔒 Percakapan aman & didukung AI kesehatan FitLife
                      </span>
                    </div>

                    {messages.map((msg, idx) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        style={{
                          animation: "fadeSlideIn 0.3s ease forwards",
                          animationDelay: `${idx === messages.length - 1 ? 0 : 0}ms`,
                        }}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                            <Bot size={13} className="text-primary" />
                          </div>
                        )}

                        <div
                          className={`flex flex-col gap-1 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              msg.role === "user"
                                ? "bg-primary text-background-dark font-semibold rounded-tr-sm whitespace-pre-wrap break-words"
                                : "bg-card-dark border border-card-border text-text-muted rounded-tl-sm break-words"
                            }`}
                          >
                            {msg.role === "assistant" ? (
                              <div className="space-y-1">
                                <ReactMarkdown components={markdownComponents}>
                                  {msg.content}
                                </ReactMarkdown>
                                {msg.isError && (
                                  <button
                                    onClick={retryLastMessage}
                                    disabled={typing}
                                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-[11px] font-semibold hover:bg-primary/25 transition-all disabled:opacity-40"
                                  >
                                    <RefreshCw size={11} />
                                    Coba Lagi
                                  </button>
                                )}
                              </div>
                            ) : (
                              msg.content
                            )}
                          </div>
                          <span className="text-[9px] text-text-muted/50 px-1">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {typing && (
                      <div className="flex gap-2.5 items-end">
                        <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Bot size={13} className="text-primary" />
                        </div>
                        <div className="bg-card-dark border border-card-border px-3.5 py-2.5 rounded-2xl rounded-tl-sm">
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 150}ms` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Prompts Bar (Chips) */}
                  {!typing && (
                    <div className="px-3 pb-1.5 pt-1 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0 bg-accent border-t border-card-border/40">
                      {activeQuickPrompts.map((q) => (
                        <button
                          key={q.text}
                          onClick={() => sendMessage(q.text)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card-dark border border-card-border text-text-muted text-[10px] font-medium hover:border-primary/40 hover:text-primary transition-all whitespace-nowrap shrink-0"
                        >
                          <span className="text-primary">{q.icon}</span>
                          <span>{q.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input Box */}
                  <div className="px-3 pb-3 pt-1 shrink-0 border-t border-card-border bg-accent">
                    <div className="flex items-center gap-2 bg-card-dark border border-green-500/40 rounded-2xl px-3 py-2 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(0,255,127,0.08)] transition-all">
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tanya seputar kesehatan, diet, nutrisi..."
                        disabled={typing}
                        className="flex-1 text-text-light text-xs placeholder:text-text-muted/50 focus:outline-none disabled:opacity-50"
                      />
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || typing}
                        className="w-7 h-7 rounded-xl bg-primary text-background-dark flex items-center justify-center hover:bg-primary-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,255,127,0.2)] hover:shadow-[0_0_14px_rgba(0,255,127,0.4)] shrink-0"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                    <p className="text-[9px] text-text-muted/40 text-center mt-1.5">
                      FitBot adalah sarana edukasi. Konsultasikan dengan dokter untuk diagnosis medis.
                    </p>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* TAB 3: HELP (Pusat Edukasi & FAQ) */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeTab === "help" && (
                <div className="flex-1 flex flex-col overflow-hidden bg-accent">
                  {/* Help Header */}
                  <div className="relative px-5 pt-5 pb-3 border-b border-card-border bg-card-dark/90 shrink-0">
                    <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                          <BookOpen size={17} className="text-primary" />
                        </div>
                        <h2 className="text-sm font-black text-text-light">
                          Pusat Bantuan & Edukasi
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        title="Tutup Panel"
                        className="p-1.5 rounded-xl text-text-muted hover:text-text-light hover:bg-background-base/50 transition-all cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-text-muted">
                      Panduan ringkas, rumus perhitungan, dan tips kesehatan FitLife.
                    </p>

                    {/* Search Bar */}
                    <div className="relative mt-3">
                      <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                      />
                      <input
                        type="text"
                        value={searchHelp}
                        onChange={(e) => setSearchHelp(e.target.value)}
                        placeholder="Cari artikel, BMI, kalori, tips..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-background-dark/80 border border-card-border text-xs text-text-light placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Help List (Scrollable) */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-thin">
                    {filteredFaqs.length === 0 ? (
                      <div className="py-8 text-center text-text-muted text-xs">
                        Tidak ditemukan artikel dengan kata kunci &quot;{searchHelp}&quot;.
                      </div>
                    ) : (
                      filteredFaqs.map((faq) => {
                        const isExpanded = expandedFaq === faq.id;
                        return (
                          <div
                            key={faq.id}
                            className="bg-card-dark border border-card-border rounded-2xl overflow-hidden transition-all"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFaq(isExpanded ? null : faq.id)
                              }
                              className="w-full text-left p-3 flex items-start justify-between gap-2 hover:bg-card-border/10 transition-colors"
                            >
                              <div>
                                <span className="inline-block text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md mb-1">
                                  {faq.category}
                                </span>
                                <p className="text-xs font-semibold text-text-light leading-snug">
                                  {faq.question}
                                </p>
                              </div>
                              <ChevronDown
                                size={14}
                                className={`text-text-muted shrink-0 mt-1 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180 text-primary" : ""
                                }`}
                              />
                            </button>

                            {isExpanded && (
                              <div className="px-3 pb-3 pt-1 border-t border-card-border/60 bg-background-dark/40">
                                <p className="text-xs text-text-muted leading-relaxed mb-3">
                                  {faq.answer}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => sendMessage(faq.prompt)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold hover:bg-primary/25 transition-all"
                                >
                                  <Sparkles size={11} />
                                  Tanyakan ke FitBot
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Bottom Help CTA */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-card-dark border border-card-border text-center">
                      <p className="text-xs font-bold text-text-light mb-1">
                        Belum menemukan jawaban?
                      </p>
                      <p className="text-[11px] text-text-muted mb-3">
                        Tanyakan langsung topik apapun seputar pola makan & kesehatan kepada FitBot.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("messages")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-background-dark text-xs font-bold hover:bg-primary-hover transition-all shadow-[0_0_10px_rgba(0,255,127,0.2)]"
                      >
                        <MessageSquare size={13} />
                        Mulai Chat dengan FitBot
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* BOTTOM NAVIGATION BAR (MongoDB Atlas / Intercom Style) */}
          {/* ───────────────────────────────────────────────────────────── */}
          {isLoggedIn && (
            <div className="shrink-0 bg-card-dark/95 border-t border-card-border px-3 py-2 flex items-center justify-around backdrop-blur-md">
              {/* Tab: Home */}
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
                  activeTab === "home"
                    ? "text-primary font-bold bg-primary/10 shadow-[0_0_12px_rgba(0,255,127,0.15)]"
                    : "text-text-muted hover:text-text-light hover:bg-card-border/20 font-medium"
                }`}
              >
                <Home size={18} className={activeTab === "home" ? "stroke-[2.4]" : "stroke-[1.8]"} />
                <span className="text-[10px]">Home</span>
              </button>

              {/* Tab: Messages */}
              <button
                type="button"
                onClick={() => setActiveTab("messages")}
                className={`relative flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
                  activeTab === "messages"
                    ? "text-primary font-bold bg-primary/10 shadow-[0_0_12px_rgba(0,255,127,0.15)]"
                    : "text-text-muted hover:text-text-light hover:bg-card-border/20 font-medium"
                }`}
              >
                <div className="relative">
                  <MessageSquare size={18} className={activeTab === "messages" ? "stroke-[2.4]" : "stroke-[1.8]"} />
                  {messages.length > 1 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(0,255,127,0.8)]" />
                  )}
                </div>
                <span className="text-[10px]">Messages</span>
              </button>

              {/* Tab: Help */}
              <button
                type="button"
                onClick={() => setActiveTab("help")}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
                  activeTab === "help"
                    ? "text-primary font-bold bg-primary/10 shadow-[0_0_12px_rgba(0,255,127,0.15)]"
                    : "text-text-muted hover:text-text-light hover:bg-card-border/20 font-medium"
                }`}
              >
                <HelpCircle size={18} className={activeTab === "help" ? "stroke-[2.4]" : "stroke-[1.8]"} />
                <span className="text-[10px]">Help</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
