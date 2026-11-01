import type { Metadata } from "next";
import ResetPasswordClient from "./reset-password-client";

export const metadata: Metadata = {
  title: "Atur Ulang Kata Sandi | FitLife",
  description: "Buat kata sandi baru untuk akun FitLife Anda",
};

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return <ResetPasswordClient token={token} />;
}
