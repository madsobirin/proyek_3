"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import AuthLayout from "@/components/auth/authLayout";
import SubmitButton from "@/components/auth/ui/button";
import { toast } from "sonner"; // Pakai sonner agar konsisten dengan login
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
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

// Komponen Internal Google Button
function GoogleAuthButton() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const registerWithGoogle = useGoogleLogin({
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
          toast.success("Berhasil mendaftar via Google!");
          router.push("/");
          router.refresh();
        } else {
          toast.error(result.message || "Gagal autentikasi Google.");
        }
      } catch {
        toast.error("Gagal terhubung ke server.");
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => toast.error("Pendaftaran Google dibatalkan."),
  });

  return (
    <motion.button
      variants={item}
      type="button"
      disabled={isGoogleLoading}
      onClick={() => registerWithGoogle()}
      className="w-full flex items-center justify-center gap-3 border border-neutral-200 bg-white rounded-xl py-3 hover:bg-gray-100 active:scale-[0.98] transition text-neutral-800 font-medium disabled:opacity-50"
    >
      <Image src="/search.png" alt="google" width={20} height={20} />
      {isGoogleLoading ? "Creating Account..." : "Continue with Google"}
    </motion.button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Submit Manual
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, captchaToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        if (result.errors) {
          setErrors(result.errors);
        } else {
          toast.error(result.message || "Gagal membuat akun.");
        }
      } else {
        router.push("/login?registered=1");
      }
    } catch {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <AuthLayout
        title="Start Your Journey"
        titleText="Create your account to access elite tracking and coaching."
        linkTitle="sudah punya akun?"
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
          {/* Full Name */}
          <motion.div variants={item} className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-neutral-700"
            >
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              className="placeholder:text-neutral-500 h-12 rounded-xl border border-neutral-200 focus-visible:ring-2 focus-visible:ring-emerald-500 text-neutral-700"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name[0]}</p>
            )}
          </motion.div>

          {/* Email */}
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
              className="placeholder:text-neutral-500 h-12 rounded-xl border border-neutral-200 focus-visible:ring-2 focus-visible:ring-emerald-500 text-neutral-700"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email[0]}</p>
            )}
          </motion.div>

          {/* Password */}
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
                placeholder="Create a secure password"
                className="placeholder:text-neutral-500 h-12 rounded-xl border border-neutral-200 pr-10 focus-visible:ring-2 focus-visible:ring-emerald-500 text-neutral-700"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password[0]}</p>
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

          {/* Submit */}
          <motion.div variants={item}>
            <SubmitButton
              titleButton={isLoading ? "Processing..." : "Create account"}
              isLoading={isLoading}
            />
          </motion.div>

          {/* Divider */}
          <motion.div variants={item} className="flex items-center gap-4 py-4">
            <div className="h-px bg-neutral-200 flex-1" />
            <span className="text-sm text-neutral-400">or join with</span>
            <div className="h-px bg-neutral-200 flex-1" />
          </motion.div>

          {/* Google Button */}
          <GoogleAuthButton />
        </motion.form>
      </AuthLayout>
    </GoogleOAuthProvider>
  );
}
