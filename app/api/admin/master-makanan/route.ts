import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis, setFoodToCache } from "@/lib/redis";

const MAX_TEXT_LENGTH = 500;
const STATS_CACHE_KEY = "admin:stats:master_makanan";

interface StatsCache {
  total: number;
  verified: number;
  community: number;
  openfoodfacts: number;
  totalScans: number;
}

async function getAggregatedStats(): Promise<StatsCache> {
  if (redis) {
    try {
      const cached = await redis.get(STATS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as StatsCache;
      }
    } catch {
      // Fallback on Redis error
    }
  }

  const [
    totalAll,
    verifiedCount,
    communityCount,
    offCount,
    scanAgg,
  ] = await Promise.all([
    prisma.masterMakanan.count(),
    prisma.masterMakanan.count({ where: { source: "verified" } }),
    prisma.masterMakanan.count({ where: { source: "community" } }),
    prisma.masterMakanan.count({ where: { source: "openfoodfacts" } }),
    prisma.masterMakanan.aggregate({ _sum: { scan_count: true } }),
  ]);

  const stats: StatsCache = {
    total: totalAll,
    verified: verifiedCount,
    community: communityCount,
    openfoodfacts: offCount,
    totalScans: scanAgg._sum.scan_count || 0,
  };

  if (redis) {
    try {
      await redis.set(STATS_CACHE_KEY, JSON.stringify(stats), "EX", 60);
    } catch {
      // Ignore cache write error
    }
  }

  return stats;
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, MAX_TEXT_LENGTH) : null;
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "admin") {
    return NextResponse.json(
      { message: "Forbidden: Akses admin diperlukan" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.max(
    1,
    Math.min(100, parseInt(searchParams.get("limit") || "10", 10) || 10),
  );
  const search = searchParams.get("search")?.trim() || "";
  const source = searchParams.get("source")?.trim() || "";
  const rawSortBy = searchParams.get("sortBy")?.trim() || "created_at";
  const rawOrder = searchParams.get("order")?.trim()?.toLowerCase() || "desc";

  const allowedSortBy = ["scan_count", "created_at", "nama_makanan"] as const;
  const sortBy = allowedSortBy.includes(rawSortBy as (typeof allowedSortBy)[number])
    ? rawSortBy
    : "created_at";
  const order = rawOrder === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = {};

  if (source && ["community", "verified", "openfoodfacts"].includes(source)) {
    where.source = source;
  }

  if (search) {
    where.OR = [
      { barcode: { contains: search, mode: "insensitive" } },
      { nama_makanan: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const statsPromise = getAggregatedStats();
    const dataPromise = prisma.masterMakanan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: order },
      include: {
        contributor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const [stats, data] = await Promise.all([statsPromise, dataPromise]);

    let totalFiltered: number;
    if (search) {
      totalFiltered = await prisma.masterMakanan.count({ where });
    } else if (source === "verified") {
      totalFiltered = stats.verified;
    } else if (source === "community") {
      totalFiltered = stats.community;
    } else if (source === "openfoodfacts") {
      totalFiltered = stats.openfoodfacts;
    } else {
      totalFiltered = stats.total;
    }

    return NextResponse.json({
      data,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      stats,
    });
  } catch (error) {
    console.error("ADMIN_MASTER_MAKANAN_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data master makanan" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "admin") {
    return NextResponse.json(
      { message: "Forbidden: Akses admin diperlukan" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body request harus berupa JSON yang valid" },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { message: "Body request harus berupa objek JSON" },
      { status: 400 },
    );
  }

  const barcode = typeof body.barcode === "string" ? body.barcode.trim() : "";
  const namaMakanan =
    typeof body.nama_makanan === "string" ? body.nama_makanan.trim() : "";

  if (!/^\d{3,64}$/.test(barcode)) {
    return NextResponse.json(
      { message: "Barcode harus terdiri dari 3 hingga 64 digit angka" },
      { status: 400 },
    );
  }

  if (!namaMakanan) {
    return NextResponse.json(
      { message: "Nama makanan wajib diisi" },
      { status: 400 },
    );
  }

  const nutritionKeys = ["kalori", "protein", "lemak", "karbohidrat", "gula"] as const;
  const nutritionValues: Record<string, number | null> = {};

  for (const key of nutritionKeys) {
    const val = optionalNumber(body[key]);
    if (val === undefined) {
      return NextResponse.json(
        { message: `Nilai ${key} harus berupa angka yang valid` },
        { status: 400 },
      );
    }
    nutritionValues[key] = val;
  }

  try {
    const existing = await prisma.masterMakanan.findUnique({
      where: { barcode },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Barcode sudah terdaftar dalam master makanan" },
        { status: 409 },
      );
    }

    const source =
      typeof body.source === "string" &&
      ["verified", "community", "openfoodfacts"].includes(body.source)
        ? body.source
        : "verified";

    const brand = optionalText(body.brand);
    const imageUrl = optionalText(body.image_url);

    const created = await prisma.masterMakanan.create({
      data: {
        barcode,
        nama_makanan: namaMakanan.slice(0, MAX_TEXT_LENGTH),
        brand,
        image_url: imageUrl,
        kalori: nutritionValues.kalori,
        protein: nutritionValues.protein,
        lemak: nutritionValues.lemak,
        karbohidrat: nutritionValues.karbohidrat,
        gula: nutritionValues.gula,
        source,
        contributor_id: auth.userId,
      },
    });

    // Invalidate stats cache so numbers refresh
    if (redis) {
      await redis.del(STATS_CACHE_KEY);
    }

    await setFoodToCache(barcode, {
      barcode,
      nama_makanan: created.nama_makanan,
      brand: created.brand,
      image_url: created.image_url,
      kalori: created.kalori,
      protein: created.protein,
      lemak: created.lemak,
      karbohidrat: created.karbohidrat,
      gula: created.gula,
      source: created.source,
    });

    return NextResponse.json(
      {
        message: "Produk makanan master berhasil ditambahkan",
        data: created,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("ADMIN_MASTER_MAKANAN_POST_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan produk master makanan" },
      { status: 500 },
    );
  }
}
