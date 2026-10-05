import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis, getFoodCacheKey, setFoodToCache } from "@/lib/redis";

const MAX_TEXT_LENGTH = 500;

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, MAX_TEXT_LENGTH);
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
  }

  try {
    const product = await prisma.masterMakanan.findUnique({
      where: { id },
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

    if (!product) {
      return NextResponse.json(
        { message: "Produk master makanan tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("ADMIN_MASTER_MAKANAN_GET_BY_ID_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal mengambil detail produk" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
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

  try {
    const existing = await prisma.masterMakanan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Produk master makanan tidak ditemukan" },
        { status: 404 },
      );
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (body.barcode !== undefined) {
      const barcode = typeof body.barcode === "string" ? body.barcode.trim() : "";
      if (!/^\d{3,64}$/.test(barcode)) {
        return NextResponse.json(
          { message: "Barcode harus terdiri dari 3 hingga 64 digit angka" },
          { status: 400 },
        );
      }
      if (barcode !== existing.barcode) {
        const barcodeConflict = await prisma.masterMakanan.findUnique({
          where: { barcode },
        });
        if (barcodeConflict) {
          return NextResponse.json(
            { message: "Barcode sudah digunakan oleh produk lain" },
            { status: 409 },
          );
        }
      }
      dataToUpdate.barcode = barcode;
    }

    if (body.nama_makanan !== undefined) {
      const nama = typeof body.nama_makanan === "string" ? body.nama_makanan.trim() : "";
      if (!nama) {
        return NextResponse.json(
          { message: "Nama makanan tidak boleh kosong" },
          { status: 400 },
        );
      }
      dataToUpdate.nama_makanan = nama.slice(0, MAX_TEXT_LENGTH);
    }

    if (body.brand !== undefined) {
      dataToUpdate.brand = optionalText(body.brand);
    }

    if (body.image_url !== undefined) {
      dataToUpdate.image_url = optionalText(body.image_url);
    }

    const nutritionKeys = ["kalori", "protein", "lemak", "karbohidrat", "gula"] as const;
    for (const key of nutritionKeys) {
      if (body[key] !== undefined) {
        const val = optionalNumber(body[key]);
        if (Number.isNaN(val)) {
          return NextResponse.json(
            { message: `Nilai ${key} harus berupa angka yang valid atau null` },
            { status: 400 },
          );
        }
        dataToUpdate[key] = val;
      }
    }

    if (body.source !== undefined) {
      if (
        typeof body.source === "string" &&
        ["verified", "community", "openfoodfacts"].includes(body.source)
      ) {
        dataToUpdate.source = body.source;
      } else {
        return NextResponse.json(
          { message: "Sumber (source) harus 'verified', 'community', atau 'openfoodfacts'" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.masterMakanan.update({
      where: { id },
      data: dataToUpdate,
    });

    // Invalidate old barcode cache if barcode changed
    if (existing.barcode !== updated.barcode && redis) {
      await redis.del(getFoodCacheKey(existing.barcode));
    }

    if (redis) {
      await redis.del("admin:stats:master_makanan");
    }

    // Update Redis cache for current product
    await setFoodToCache(updated.barcode, {
      barcode: updated.barcode,
      nama_makanan: updated.nama_makanan,
      brand: updated.brand,
      image_url: updated.image_url,
      kalori: updated.kalori,
      protein: updated.protein,
      lemak: updated.lemak,
      karbohidrat: updated.karbohidrat,
      gula: updated.gula,
      source: updated.source,
    });

    return NextResponse.json({
      message: "Produk master makanan berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("ADMIN_MASTER_MAKANAN_PUT_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui produk master makanan" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
  }

  try {
    const existing = await prisma.masterMakanan.findUnique({
      where: { id },
      select: { barcode: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Produk master makanan tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.masterMakanan.delete({
      where: { id },
    });

    if (redis) {
      await redis.del(getFoodCacheKey(existing.barcode));
      await redis.del("admin:stats:master_makanan");
    }

    return NextResponse.json({
      message: "Produk berhasil dihapus",
    });
  } catch (error) {
    console.error("ADMIN_MASTER_MAKANAN_DELETE_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menghapus produk master makanan" },
      { status: 500 },
    );
  }
}
