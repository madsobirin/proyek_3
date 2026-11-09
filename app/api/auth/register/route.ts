import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignupFormSchema } from "@/lib/definition";
import { verifyRecaptcha } from "@/lib/recaptcha";
import bcrypt from "bcryptjs";
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

    const validatedFields = SignupFormSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { errors: validatedFields.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, password } = validatedFields.data;

    const existingAccount = await prisma.account.findUnique({
      where: { email },
    });
    if (existingAccount) {
      return NextResponse.json(
        { message: "Email sudah terdaftar." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.account.create({
      data: { name, email, password: hashedPassword },
    });

    const token = await new SignJWT({
      userId: user.id,
      role: user.role,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return NextResponse.json(
      {
        message: "Registrasi berhasil",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("REGISTER_ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
