import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ForgotPasswordSchema } from "@/lib/definition";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { createPasswordResetToken } from "@/lib/token";
import { sendResetPasswordEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const captcha = await verifyRecaptcha(body.captchaToken);
    if (!captcha.success) {
      return NextResponse.json(
        { message: captcha.message || "Verifikasi reCAPTCHA gagal." },
        { status: 400 },
      );
    }

    const validatedFields = ForgotPasswordSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { errors: validatedFields.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email } = validatedFields.data;

    // Cari user berdasarkan email (case-insensitive)
    const user = await prisma.account.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    // Jika user tidak ditemukan, tetap beri pesan sukses demi keamanan (mencegah email enumeration)
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Jika email terdaftar di sistem kami, instruksi reset password telah dikirimkan ke email Anda.",
        },
        { status: 200 },
      );
    }

    // Buat token reset password (berlaku 1 jam)
    const token = await createPasswordResetToken({
      userId: user.id,
      email: user.email,
      passwordHash: user.password,
    });

    // Tentukan URL dasar aplikasi
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

    // Kirim email
    const mailResult = await sendResetPasswordEmail({
      to: user.email,
      name: user.name || "Pengguna",
      resetUrl,
    });

    if (!mailResult.success) {
      console.error("[FORGOT_PASSWORD] Mail send failed:", mailResult.error);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Link reset password telah berhasil dikirim ke email Anda. Silakan periksa kotak masuk atau spam.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi." },
      { status: 500 },
    );
  }
}
