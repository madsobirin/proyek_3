"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, Variants } from "framer-motion";
import AuthLayout from "@/components/auth/authLayout";
import SubmitButton from "@/components/auth/ui/button";
import { toast } from "sonner";
import { MailCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { ReCaptcha, ReCaptchaRef } from "@/components/auth/ReCaptcha";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 25 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        if (result.errors?.email) {
          setError(result.errors.email[0]);
        } else {
          toast.error(
            result.message || "Gagal mengirim link reset kata sandi.",
          );
        }
      } else {
        setIsSubmitted(true);
        toast.success("Link reset password berhasil dikirim!");
      }
    } catch {
      toast.error("Gagal terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title={isSubmitted ? "Periksa Email Anda" : "Lupa Kata Sandi?"}
      titleText={
        isSubmitted
          ? "Instruksi reset kata sandi telah dikirimkan ke alamat email Anda."
          : "Masukkan email terdaftar Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi."
      }
      linkTitle="Ingat kata sandi?"
      linkText="Login"
      href="/login"
    >
      {isSubmitted ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div
            variants={item}
            className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-sm text-center space-y-4"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <MailCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-neutral-800 text-lg">
                Email Terkirim
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Kami telah mengirimkan tautan verifikasi ke{" "}
                <strong className="text-neutral-700 font-medium">{email}</strong>.
                Tautan berlaku selama 1 jam.
              </p>
            </div>

            <p className="text-xs text-neutral-400">
              Tidak menerima email? Cek folder spam atau coba kirim ulang setelah beberapa saat.
            </p>
          </motion.div>

          <motion.div variants={item} className="flex flex-col gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsSubmitted(false)}
              className="w-full flex items-center justify-center gap-2 border border-neutral-200 bg-white rounded-xl py-3 hover:bg-gray-50 active:scale-[0.98] transition text-neutral-700 font-medium text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Kirim ulang atau ganti email
            </button>

            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-3 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Halaman Login
            </Link>
          </motion.div>
        </motion.div>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div variants={item} className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-neutral-700"
            >
              Alamat Email Terdaftar
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              className="placeholder:text-neutral-500 h-12 rounded-xl border border-neutral-200 bg-white focus-visible:ring-2 focus-visible:ring-emerald-500 text-neutral-700"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
            />
            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
          </motion.div>

          {/* reCAPTCHA v2 */}
          <motion.div variants={item}>
            <ReCaptcha
              ref={recaptchaRef}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
            />
          </motion.div>

          <motion.div variants={item}>
            <SubmitButton
              titleButton={isLoading ? "Mengirim Tautan..." : "Kirim Link Reset"}
              isLoading={isLoading}
            />
          </motion.div>

          <motion.div variants={item} className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Batal dan kembali ke Login
            </Link>
          </motion.div>
        </motion.form>
      )}
    </AuthLayout>
  );
}
