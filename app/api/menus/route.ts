import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MenuSchema } from "@/lib/definition";
import { TargetStatus } from "@/generated/prisma/client";
import { getAuthUser } from "@/lib/auth";

const VALID_TARGET_STATUS = ["Kurus", "Normal", "Berlebih", "Obesitas"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("target");
    const idParam = searchParams.get("id");

    // Pagination — opsional, default ambil semua kalau tidak dikirim
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const isPaginated = pageParam !== null || limitParam !== null;
    const page = parseInt(pageParam || "1");
    const limit = parseInt(limitParam || "10");
    const offset = (page - 1) * limit;

    if (target && !VALID_TARGET_STATUS.includes(target)) {
      return NextResponse.json(
        {
          message:
            "Target status tidak valid. Pilihan: Kurus, Normal, Berlebih, Obesitas",
        },
        { status: 400 },
      );
    }

    let idParsed: number | undefined;
    if (idParam) {
      idParsed = parseInt(idParam);
      if (isNaN(idParsed)) {
        return NextResponse.json(
          { message: "ID tidak valid" },
          { status: 400 },
        );
      }
    }

    const kaloriMaxParam = searchParams.get("kalori_max");
    const kaloriMinParam = searchParams.get("kalori_min");

    const kaloriMax = kaloriMaxParam ? parseInt(kaloriMaxParam) : undefined;
    const kaloriMin = kaloriMinParam ? parseInt(kaloriMinParam) : undefined;

    const where = {
      id: idParsed,
      target_status: target ? (target as TargetStatus) : undefined,
      kalori:
        (kaloriMax && !isNaN(kaloriMax)) || (kaloriMin && !isNaN(kaloriMin))
          ? {
              gte: kaloriMin && !isNaN(kaloriMin) ? kaloriMin : undefined,
              lte: kaloriMax && !isNaN(kaloriMax) ? kaloriMax : undefined,
            }
          : undefined,
    };

    // Kalau pakai pagination → pakai skip/take + count
    if (isPaginated) {
      const [menus, total] = await Promise.all([
        prisma.menu.findMany({
          where,
          orderBy: { created_at: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.menu.count({ where }),
      ]);

      return NextResponse.json(
        {
          data: menus,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
          },
        },
        { status: 200 },
      );
    }

    // Kalau tidak pakai pagination → return array biasa (backward compatible)
    const menus = await prisma.menu.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(menus, { status: 200 });
  } catch (error: unknown) {
    console.error("GET_MENUS_ERROR", error);
    return NextResponse.json(
      { message: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    // ── Auth check — hanya admin ──
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const validatedFields = MenuSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { errors: validatedFields.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Generate slug dari nama_menu
    const slug =
      validatedFields.data.nama_menu
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "") + `-${Date.now()}`;

    const newMenu = await prisma.menu.create({
      data: {
        ...validatedFields.data,
        slug,
      },
    });

    return NextResponse.json(
      { message: "Menu berhasil ditambahkan", data: newMenu },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("POST_MENU_ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
