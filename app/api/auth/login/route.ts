import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LoginFormSchema } from "@/lib/definition";
import { verifyRecaptcha } from "@/lib/recaptcha";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

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

    const validatedFields = LoginFormSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { errors: validatedFields.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = validatedFields.data;

    const user = await prisma.account.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Email atau password salah." },
        { status: 401 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Email atau password salah." },
        { status: 401 },
      );
    }

    // ── Buat JWT ──
    const token = await new SignJWT({
      userId: user.id,
      role: user.role,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // ── Simpan ke cookie (untuk web/browser) ──
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.delete("userId");
    cookieStore.delete("role");

    // Update last_login_at
    await prisma.account.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    return NextResponse.json(
      {
        message: "Login berhasil",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
