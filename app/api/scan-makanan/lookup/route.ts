import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFoodFromCache, setFoodToCache } from "@/lib/redis";
import { lookupOpenFoodFacts } from "@/lib/openfoodfacts";
import type { FoodProduct } from "@/lib/types/food";

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

  // EAN/UPC barcode validation: 3 sampai 64 digit angka
  if (!/^\d{3,64}$/.test(barcode)) {
    return NextResponse.json(
      { message: "Barcode harus berisi 3 sampai 64 digit angka" },
      { status: 400 },
    );
  }

  try {
    // 1. Cek Redis global cache terlebih dahulu (key: food:barcode:<barcode>)
    const cachedProduct = await getFoodFromCache(barcode);
    if (cachedProduct) {
      // Cache HIT: langsung return data
      return NextResponse.json(cachedProduct, {
        headers: {
          "X-Cache": "HIT",
          "X-Data-Source": "Redis",
        },
      });
    }

    // Cache MISS: 2. Cek database master komunitas (tabel master_makanan)
    let localProduct = null;
    try {
      localProduct = await prisma.masterMakanan.findUnique({
        where: { barcode },
      });
    } catch (dbErr) {
      console.warn("[LOOKUP_MASTER_DB_WARN]:", dbErr);
    }

    if (localProduct) {
      // Update counter scan_count secara asinkron
      prisma.masterMakanan
        .update({
          where: { barcode },
          data: { scan_count: { increment: 1 } },
        })
        .catch((err) =>
          console.warn("[SCAN_MAKANAN_COUNTER_WARN]:", err?.message),
        );

      const product: FoodProduct = {
        barcode: localProduct.barcode,
        nama_makanan: localProduct.nama_makanan,
        brand: localProduct.brand,
        image_url: localProduct.image_url,
        kalori: localProduct.kalori,
        protein: localProduct.protein,
        lemak: localProduct.lemak,
        karbohidrat: localProduct.karbohidrat,
        gula: localProduct.gula,
        source: localProduct.source,
      };

      // Simpan ke Redis cache untuk pencarian selanjutnya
      await setFoodToCache(barcode, product);

      const sourceHeader =
        localProduct.source === "openfoodfacts"
          ? "OpenFoodFacts"
          : "FitLife-Community";

      return NextResponse.json(product, {
        headers: {
          "X-Cache": "MISS",
          "X-Data-Source": sourceHeader,
        },
      });
    }

    // 3. Request ke Open Food Facts API eksternal
    const product: FoodProduct | null = await lookupOpenFoodFacts(barcode);

    if (product) {
      // Open Food Facts HIT: simpan ke Master DB dan Redis
      try {
        await prisma.masterMakanan.upsert({
          where: { barcode },
          update: { scan_count: { increment: 1 } },
          create: {
            barcode: product.barcode,
            nama_makanan: product.nama_makanan,
            brand: product.brand,
            image_url: product.image_url,
            kalori: product.kalori,
            protein: product.protein,
            lemak: product.lemak,
            karbohidrat: product.karbohidrat,
            gula: product.gula,
            source: "openfoodfacts",
          },
        });
      } catch (dbErr) {
        console.warn("[LOOKUP_MASTER_UPSERT_WARN]:", dbErr);
      }

      await setFoodToCache(barcode, product);
      return NextResponse.json(product, {
        headers: {
          "X-Cache": "MISS",
          "X-Data-Source": "OpenFoodFacts",
        },
      });
    }

    // 4. Produk tidak ditemukan sama sekali
    return NextResponse.json(
      { message: "Produk dengan barcode tersebut tidak ditemukan" },
      { status: 404 },
    );
  } catch (error) {
    console.error("[SCAN_MAKANAN_LOOKUP_ERROR]:", error);
    return NextResponse.json(
      { message: "Gagal menghubungi layanan pencarian produk" },
      { status: 502 },
    );
  }
}
