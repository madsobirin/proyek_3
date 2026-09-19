import { NextResponse } from "next/server";

const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v0/product";

type Nutriments = Record<string, unknown>;

function toNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getNutrient(nutriments: Nutriments, key: string): number | null {
  return toNumber(nutriments[`${key}_100g`]) ?? toNumber(nutriments[key]);
}

export async function POST(request: Request) {
  let barcode: string;

  try {
    const body = await request.json();
    barcode = String(body?.barcode ?? "").trim();
  } catch {
    return NextResponse.json(
      { message: "Body request harus berupa JSON yang valid" },
      { status: 400 },
    );
  }

  // EAN/UPC dan barcode Open Food Facts terdiri dari angka. Pembatasan ini
  // juga mencegah nilai barcode dipakai sebagai bagian URL yang tidak aman.
  if (!/^\d{3,64}$/.test(barcode)) {
    return NextResponse.json(
      { message: "Barcode harus berisi 3 sampai 64 digit angka" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_URL}/${encodeURIComponent(barcode)}.json`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "Layanan pencarian produk sedang tidak tersedia" },
        { status: 502 },
      );
    }

    const result = await response.json();
    if (result.status !== 1 || !result.product) {
      return NextResponse.json(
        { message: "Produk dengan barcode tersebut tidak ditemukan" },
        { status: 404 },
      );
    }

    const product = result.product as Record<string, unknown>;
    const nutriments = (product.nutriments ?? {}) as Nutriments;
    const namaMakanan = String(product.product_name ?? "").trim();

    if (!namaMakanan) {
      return NextResponse.json(
        { message: "Produk ditemukan, tetapi nama produk tidak tersedia" },
        { status: 422 },
      );
    }

    return NextResponse.json({
      barcode,
      nama_makanan: namaMakanan,
      brand: String(product.brands ?? "").trim() || null,
      image_url:
        String(product.image_front_url ?? product.image_url ?? "").trim() ||
        null,
      kalori: getNutrient(nutriments, "energy-kcal"),
      protein: getNutrient(nutriments, "proteins"),
      lemak: getNutrient(nutriments, "fat"),
      karbohidrat: getNutrient(nutriments, "carbohydrates"),
      gula: getNutrient(nutriments, "sugars"),
    });
  } catch (error) {
    console.error("SCAN_MAKANAN_LOOKUP_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menghubungi layanan pencarian produk" },
      { status: 502 },
    );
  }
}
