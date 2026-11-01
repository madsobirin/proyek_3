"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion, Variants } from "framer-motion";
import AuthLayout from "@/components/auth/authLayout";
import SubmitButton from "@/components/auth/ui/button";
import { toast } from "sonner";

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

type Props = {
  token?: string;
};

export default function ResetPasswordClient({ token }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Jika tidak ada token di URL query
  if (!token) {
    return (
      <AuthLayout
        title="Tautan Tidak Valid"
        titleText="Tautan reset kata sandi tidak ditemukan atau tidak lengkap."
        linkTitle="Ingat kata sandi?"
        linkText="Login"
        href="/login"
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div
            variants={item}
            className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-red-900 text-base">
                Token Reset Diperlukan
              </h3>
              <p className="text-sm text-red-600">
                Silakan buka tautan dari email Anda atau ajukan permintaan reset baru.
              </p>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <Link
              href="/forgot-password"
              className="w-full flex items-center justify-center rounded-2xl bg-emerald-500 py-3.5 font-semibold text-white hover:bg-emerald-600 transition shadow-sm"
            >
              Ajukan Permintaan Reset Baru
            </Link>
          </motion.div>
        </motion.div>
      </AuthLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Validasi konfirmasi password di client-side
    if (formData.password !== formData.confirmPassword) {
      setErrors({
        confirmPassword: ["Konfirmasi kata sandi tidak cocok."],
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          toast.error(
            result.message || "Gagal mengatur ulang kata sandi.",
          );
        }
      } else {
        toast.success(
          result.message || "Kata sandi berhasil diperbarui! Silakan masuk.",
          { duration: 3000 }
        );
        router.push("/login");
      }
    } catch {
      toast.error("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    } finally {
      setIsLoading(false);
    }
  }

  // Helper untuk cek kriteria password
  const hasMinLength = formData.password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);

  return (
    <AuthLayout
      title="Kata Sandi Baru"
      titleText="Buat kata sandi baru yang kuat untuk melindungi akun Anda."
      linkTitle="Batal reset?"
      linkText="Login"
      href="/login"
    >
      <motion.form
        onSubmit={handleSubmit}
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Tombol Kembali ke Lupa Password */}
        <motion.div variants={item} className="-mt-4">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-emerald-600 transition font-medium group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Lupa Kata Sandi
          </Link>
        </motion.div>

        {/* Password Baru */}
        <motion.div variants={item} className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-neutral-700"
          >
            Kata Sandi Baru
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              required
              className="placeholder:text-neutral-500 h-12 rounded-xl border border-neutral-200 bg-white pr-10 focus-visible:ring-2 focus-visible:ring-emerald-500 text-neutral-700"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 font-medium">
              {errors.password[0]}
            </p>
          )}

          {/* Indikator Validasi Password */}
          <div className="pt-1.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  hasMinLength ? "text-emerald-500" : "text-neutral-300"
                }`}
              />
              <span
                className={hasMinLength ? "text-emerald-700 font-medium" : "text-neutral-400"}
              >
                Minimal 8 karakter
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  hasLetter && hasNumber ? "text-emerald-500" : "text-neutral-300"
                }`}
              />
              <span
                className={
                  hasLetter && hasNumber
                    ? "text-emerald-700 font-medium"
                    : "text-neutral-400"
                }
              >
                Kombinasi huruf & angka
              </span>
            </div>
          </div>
        </motion.div>

        {/* Konfirmasi Password Baru */}
        <motion.div variants={item} className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-neutral-700"
          >
            Konfirmasi Kata Sandi Baru
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ketik ulang kata sandi baru"
              required
              className="placeholder:text-neutral-500 h-12 rounded-xl border border-neutral-200 bg-white pr-10 focus-visible:ring-2 focus-visible:ring-emerald-500 text-neutral-700"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 font-medium">
              {errors.confirmPassword[0]}
            </p>
          )}
        </motion.div>

        {/* Tombol Simpan */}
        <motion.div variants={item}>
          <SubmitButton
            titleButton={isLoading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
            isLoading={isLoading}
          />
        </motion.div>

        <motion.div variants={item} className="pt-2 flex flex-col items-center gap-2 text-center">
          <Link
            href="/forgot-password"
            className="text-xs text-neutral-500 hover:text-emerald-600 transition font-medium"
          >
            Tautan kedaluwarsa? <span className="text-emerald-600 font-semibold underline">Kirim ulang permintaan</span>
          </Link>
          <Link
            href="/login"
            className="text-xs text-neutral-400 hover:text-neutral-700 transition"
          >
            Batal dan kembali ke Login
          </Link>
        </motion.div>
      </motion.form>
    </AuthLayout>
  );
}
