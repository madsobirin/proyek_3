import { NextResponse } from "next/server";
import { getFoodFromCache, setFoodToCache } from "@/lib/redis";
import { lookupFatSecret } from "@/lib/fatsecret";
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
      { status: 400 }
    );
  }

  // EAN/UPC barcode validation: 3 sampai 64 digit angka
  if (!/^\d{3,64}$/.test(barcode)) {
    return NextResponse.json(
      { message: "Barcode harus berisi 3 sampai 64 digit angka" },
      { status: 400 }
    );
  }

  try {
    // 1. Cek Redis global cache terlebih dahulu (key: food:barcode:<barcode>)
    const cachedProduct = await getFoodFromCache(barcode);
    if (cachedProduct) {
      // Cache HIT: langsung return data, JANGAN panggil FatSecret / Open Food Facts
      return NextResponse.json(cachedProduct, {
        headers: { "X-Cache": "HIT" },
      });
    }

    // Cache MISS: 2. Request ke FatSecret sebagai API utama
    let product: FoodProduct | null = await lookupFatSecret(barcode);

    if (product) {
      // FatSecret HIT: simpan ke Redis dengan TTL, lalu return
      await setFoodToCache(barcode, product);
      return NextResponse.json(product, {
        headers: {
          "X-Cache": "MISS",
          "X-Data-Source": "FatSecret",
        },
      });
    }

    // 3. FatSecret tidak menemukan / gagal: request ke Open Food Facts sebagai fallback
    product = await lookupOpenFoodFacts(barcode);

    if (product) {
      // Open Food Facts HIT: normalisasi format, simpan ke Redis dengan TTL, lalu return
      await setFoodToCache(barcode, product);
      return NextResponse.json(product, {
        headers: {
          "X-Cache": "MISS",
          "X-Data-Source": "OpenFoodFacts",
        },
      });
    }

    // 4. Kedua API tidak menemukan produk
    return NextResponse.json(
      { message: "Produk dengan barcode tersebut tidak ditemukan" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[SCAN_MAKANAN_LOOKUP_ERROR]:", error);
    return NextResponse.json(
      { message: "Gagal menghubungi layanan pencarian produk" },
      { status: 502 }
    );
  }
}
