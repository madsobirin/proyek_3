"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
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
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
};

const QUICK_PROMPTS = [
  { icon: <Scale size={13} />, text: "Cek tinggi & berat badan" },
  { icon: <Heart size={13} />, text: "Status BMI terakhir" },
  { icon: <Sparkles size={13} />, text: "Hitung kalori harian" },
  { icon: <Utensils size={13} />, text: "Rekomendasi menu diet" },
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

export default function ChatPanel({
  open,
  onClose,
  isLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Halo! Saya FitBot, asisten kesehatan Anda. Saya siap untuk membantu pertanyaan seputar diet, nutrisi, olahraga, dan gaya hidup sehat. Ada yang bisa saya bantu? 😊",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || typing) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
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
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Maaf, server AI sedang sibuk. Silakan coba lagi.",
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
          id: crypto.randomUUID(),
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
    // Hapus pesan error terakhir, ambil pesan user terakhir, lalu kirim ulang
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    // Hapus pesan error dari list
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

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-background-dark/40 backdrop-blur-sm z-1040 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed z-1050 transition-all duration-300 ease-out
          bottom-24 right-6
          w-[calc(100vw-3rem)] max-w-[400px]
          md:bottom-24 md:right-6 md:w-[400px]
          ${
            open
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
      >
        <div className="bg-background-dark border border-card-border rounded-3xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col h-[580px] max-h-[80vh]">
          {/* ── Header ── */}
          <div className="relative px-5 py-4 border-b border-card-border bg-card-dark/80 shrink-0">
            {/* Glow line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />

            <div className="flex items-center gap-3">
              {/* Bot avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Bot size={20} className="text-primary" />
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background-dark shadow-[0_0_6px_rgba(0,255,127,0.6)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-text-light">FitBot</p>
                  <span className="flex items-center gap-1 text-[10px] text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                    <Sparkles size={9} className="fill-primary" /> AI Health
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">
                  {typing ? (
                    <span className="text-primary animate-pulse">
                      Sedang mengetik...
                    </span>
                  ) : (
                    "Asisten kesehatan & nutrisi Anda"
                  )}
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-text-muted hover:text-text-light hover:bg-background-base/50 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Login Prompt (belum login) ── */}
          {!isLoggedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center bg-accent">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <LogIn size={28} className="text-primary" />
              </div>
              <h3 className="text-sm font-bold text-text-light mb-2">
                Login Diperlukan
              </h3>
              <p className="text-xs text-text-muted leading-relaxed mb-5">
                Silakan login terlebih dahulu untuk menggunakan FitBot dan
                mendapatkan saran kesehatan personal.
              </p>
              <a
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-background-dark text-xs font-bold hover:bg-primary-hover transition-all shadow-[0_0_12px_rgba(0,255,127,0.3)] hover:shadow-[0_0_18px_rgba(0,255,127,0.5)]"
              >
                <LogIn size={14} />
                Login Sekarang
              </a>
            </div>
          ) : (
            <>
              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin bg-accent">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    style={{
                      animation: "fadeSlideIn 0.3s ease forwards",
                      animationDelay: `${idx === messages.length - 1 ? 0 : 0}ms`,
                    }}
                  >
                    {/* Avatar */}
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                        <Bot size={14} className="text-primary" />
                      </div>
                    )}

                    <div
                      className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
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
                      <span className="text-[10px] text-text-muted/50 px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex gap-2.5 items-end">
                    <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-primary" />
                    </div>
                    <div className="bg-card-dark border border-card-border px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce "
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Quick Prompts ── */}
              {!typing && (
                <div className="px-4 pb-2 grid grid-cols-2 gap-2 shrink-0 bg-accent">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q.text}
                      onClick={() => sendMessage(q.text)}
                      className="flex items-start text-left gap-1.5 px-3 py-2 rounded-xl bg-card-dark border border-card-border text-text-muted text-[11px] font-semibold hover:border-primary/40 hover:text-primary transition-all"
                    >
                      <span className="text-primary mt-0.5">{q.icon}</span>
                      <span>{q.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Input ── */}
              <div className="px-4 pb-4 pt-2 shrink-0 border-t border-card-border bg-accent">
                <div className="flex items-center gap-2 bg-card-dark border border-green-400 rounded-2xl px-4 py-2.5 focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_rgba(0,255,127,0.06)] transition-all">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tanya seputar kesehatan..."
                    disabled={typing}
                    className="flex-1 text-text-light text-xs placeholder:text-text-muted/50 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || typing}
                    className="w-8 h-8 rounded-xl bg-primary text-background-dark flex items-center justify-center hover:bg-primary-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,255,127,0.2)] hover:shadow-[0_0_14px_rgba(0,255,127,0.4)] shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-text-muted/40 text-center mt-2">
                  FitBot dapat membuat kesalahan. Konsultasikan dokter untuk
                  diagnosis.
                </p>
              </div>
            </>
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
