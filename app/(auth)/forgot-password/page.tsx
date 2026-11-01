import type { Metadata } from "next";
import ForgotPasswordClient from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Lupa Password | FitLife",
  description: "Reset kata sandi akun FitLife Anda",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
