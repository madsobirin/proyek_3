import type { FoodProduct } from "./types/food";

const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v0/product";

type Nutriments = Record<string, unknown>;

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getNutrient(nutriments: Nutriments, key: string): number | null {
  return toNumber(nutriments[`${key}_100g`]) ?? toNumber(nutriments[key]);
}

/**
 * Lookup food barcode on Open Food Facts API.
 * Returns normalized FoodProduct or null if not found or on error.
 */
export async function lookupOpenFoodFacts(barcode: string): Promise<FoodProduct | null> {
  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_URL}/${encodeURIComponent(barcode)}.json`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result.status !== 1 || !result.product) {
      return null;
    }

    const product = result.product as Record<string, unknown>;
    const nutriments = (product.nutriments ?? {}) as Nutriments;
    const namaMakanan = String(product.product_name ?? "").trim();

    if (!namaMakanan) {
      return null;
    }

    return {
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
    };
  } catch (error) {
    console.warn("[OpenFoodFacts] Lookup error for barcode:", barcode, error);
    return null;
  }
}
