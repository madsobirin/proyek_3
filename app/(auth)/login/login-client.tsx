"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import AuthLayout from "@/components/auth/authLayout";
import SubmitButton from "@/components/auth/ui/button";
import { toast } from "sonner";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

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

// Komponen Internal untuk Tombol Google agar bisa pakai Hook useGoogleLogin
function GoogleAuthButton() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success("Login Google Berhasil!", {
            duration: 2000,
            closeButton: true,
          });
          router.push("/");
          router.refresh();
        } else {
          toast.error(result.message || "Gagal autentikasi Google.", {
            duration: 2000,
          });
        }
      } catch {
        toast.error("Terjadi kesalahan koneksi ke server.", { duration: 2000 });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => toast.error("Login Google dibatalkan.", { duration: 2000 }),
  });

  return (
    <motion.button
      variants={item}
      type="button"
      disabled={isGoogleLoading}
      onClick={() => loginWithGoogle()}
      className="w-full flex items-center justify-center gap-3 border border-neutral-200 bg-white rounded-xl py-3 hover:bg-gray-100 active:scale-[0.98] transition text-neutral-800 font-medium disabled:opacity-50"
    >
      <Image src="/search.png" alt="google" width={20} height={20} />
      {isGoogleLoading ? "Connecting..." : "Continue with Google"}
    </motion.button>
  );
}

export default function LoginClient({ registered }: { registered?: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login Manual (Email & Password)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          toast.error(
            result.message || "Login gagal, cek kembali kredensial Anda.",
          );
        }
      } else {
        toast.success("Login Berhasil!", { duration: 2000, closeButton: true });
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Gagal terhubung ke server.", { duration: 2000 });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (registered === "1") {
      toast.success("Akun berhasil dibuat, silakan login.", {
        id: "register-success",
      });
      // Menghapus query param agar jika di-refresh toast tidak muncul lagi
      router.replace("/login", { scroll: false });
    }
  }, [registered, router]);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <AuthLayout
        title="Welcome Back"
        titleText="Enter your credentials to access your dashboard."
        linkTitle="belum punya akun"
        linkText="Register"
        href="/register"
      >
        <motion.form
          onSubmit={handleSubmit}
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Email Field */}
          <motion.div variants={item} className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-neutral-700"
            >
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              className="placeholder:text-neutral-500 h-12 rounded-xl border border-neutral-200 bg-white focus-visible:ring-2 focus-visible:ring-emerald-500 text-neutral-700"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">
                {errors.email[0]}
              </p>
            )}
          </motion.div>

          {/* Password Field */}
          <motion.div variants={item} className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-neutral-700"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Lupa kata sandi?
              </Link>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={item}>
            <SubmitButton
              titleButton={isLoading ? "Authenticating..." : "Continue account"}
              isLoading={isLoading}
            />
          </motion.div>

          {/* Divider */}
          <motion.div variants={item} className="flex items-center gap-4 py-4">
            <div className="h-px bg-neutral-200 flex-1" />
            <span className="text-sm text-neutral-400">or join with</span>
            <div className="h-px bg-neutral-200 flex-1" />
          </motion.div>

          {/* Tombol Google Dinamis */}
          <GoogleAuthButton />
        </motion.form>
      </AuthLayout>
    </GoogleOAuthProvider>
  );
}
