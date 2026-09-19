import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_TEXT_LENGTH = 500;

function optionalText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, MAX_TEXT_LENGTH) : null;
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
  const nutritionValues = [
    body.kalori,
    body.protein,
    body.lemak,
    body.karbohidrat,
    body.gula,
  ].map(optionalNumber);

  if (!/^\d{3,64}$/.test(barcode) || !namaMakanan) {
    return NextResponse.json(
      { message: "Barcode dan nama_makanan wajib diisi dengan benar" },
      { status: 400 },
    );
  }

  if (nutritionValues.some((value) => value === undefined)) {
    return NextResponse.json(
      { message: "Nilai gizi harus berupa angka yang valid" },
      { status: 400 },
    );
  }

  try {
    const scanMakanan = await prisma.scanMakanan.create({
      data: {
        user_id: auth.userId,
        barcode,
        nama_makanan: namaMakanan.slice(0, MAX_TEXT_LENGTH),
        brand: optionalText(body.brand),
        image_url: optionalText(body.image_url),
        kalori: nutritionValues[0],
        protein: nutritionValues[1],
        lemak: nutritionValues[2],
        karbohidrat: nutritionValues[3],
        gula: nutritionValues[4],
      },
    });

    return NextResponse.json(
      { message: "Hasil scan berhasil disimpan", data: scanMakanan },
      { status: 201 },
    );
  } catch (error) {
    console.error("SCAN_MAKANAN_SAVE_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan hasil scan" },
      { status: 500 },
    );
  }
}
