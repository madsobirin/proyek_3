import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

// Zod schema untuk validasi
const LokasiSchema = z.object({
  name: z
    .string()
    .min(3, "Nama lokasi minimal 3 karakter")
    .max(200, "Nama lokasi maksimal 200 karakter")
    .trim(),
  category: z
    .enum(["gym", "lapangan", "low_impact"])
    .optional()
    .default("lapangan"),
  address: z
    .string()
    .max(500, "Alamat maksimal 500 karakter")
    .trim()
    .optional()
    .nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

const TARGET_TO_CATEGORY: Record<string, string> = {
  Kurus: "gym",
  Normal: "lapangan",
  Berlebih: "low_impact",
  Obesitas: "low_impact",
};

// GET — ambil semua lokasi olahraga (publik)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryParam = searchParams.get("category")?.trim() || "";
    const targetParam = searchParams.get("target")?.trim() || "";

    const resolvedCategory =
      categoryParam || (targetParam ? TARGET_TO_CATEGORY[targetParam] : "");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (resolvedCategory && ["gym", "lapangan", "low_impact"].includes(resolvedCategory)) {
      where.category = resolvedCategory;
    }

    const locations = await prisma.lokasiOlahraga.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        account: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(locations, { status: 200 });
  } catch (error: unknown) {
    console.error("GET_LOKASI_ERROR", error);
    return NextResponse.json(
      { message: "Gagal mengambil data lokasi" },
      { status: 500 },
    );
  }
}

// POST — tambah lokasi olahraga baru (user harus login)
export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const validated = LokasiSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { errors: validated.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const newLokasi = await prisma.lokasiOlahraga.create({
      data: {
        ...validated.data,
        user_id: auth.userId,
      },
    });

    return NextResponse.json(
      { message: "Lokasi berhasil ditambahkan", data: newLokasi },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("POST_LOKASI_ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
