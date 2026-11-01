import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResetPasswordSchema } from "@/lib/definition";
import { verifyPasswordResetToken } from "@/lib/token";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validatedFields = ResetPasswordSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { errors: validatedFields.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { token, password } = validatedFields.data;

    // Verifikasi token JWT
    const payload = await verifyPasswordResetToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          message:
            "Tautan reset kata sandi tidak valid atau telah kedaluwarsa. Silakan lakukan permintaan reset kata sandi baru.",
        },
        { status: 400 },
      );
    }

    // Ambil data akun dari database
    const user = await prisma.account.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Akun pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    // Pastikan token belum pernah digunakan sebelumnya
    if (payload.hashSnippet && payload.hashSnippet !== "no-password") {
      const currentSnippet = user.password ? user.password.slice(-10) : "";
      if (currentSnippet !== payload.hashSnippet) {
        return NextResponse.json(
          {
            message:
              "Tautan reset kata sandi ini sudah pernah digunakan sebelumnya. Silakan ajukan permintaan baru.",
          },
          { status: 400 },
        );
      }
    }

    // Hash kata sandi baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // Perbarui kata sandi di database
    await prisma.account.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Kata sandi Anda berhasil diperbarui! Silakan login dengan kata sandi baru.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server saat memperbarui kata sandi." },
      { status: 500 },
    );
  }
}
