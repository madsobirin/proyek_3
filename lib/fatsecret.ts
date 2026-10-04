import type { FoodProduct } from "./types/food";

const FATSECRET_TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const FATSECRET_BARCODE_V2_URL = "https://platform.fatsecret.com/rest/food/barcode/find-by-id/v2";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Get OAuth2 client credentials access token for FatSecret API.
 * Caches token in-memory until near expiry.
 */
async function getFatSecretToken(): Promise<string | null> {
  const clientId = process.env.FATSECRET_CLIENT_ID?.trim();
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  // Return cached token if still valid (60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.accessToken;
  }

  const fetchTokenWithScope = async (targetScope: string) => {
    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const params = new URLSearchParams();
      params.append("grant_type", "client_credentials");
      params.append("scope", targetScope);

      const response = await fetch(FATSECRET_TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.warn(
          `[FatSecret] Failed to obtain token with scope '${targetScope}', HTTP status: ${response.status}:`,
          data?.error_description || data?.error || response.statusText
        );
        return { ok: false, error: data?.error as string | undefined };
      }

      if (!data?.access_token) {
        console.warn("[FatSecret] Token response missing access_token");
        return { ok: false };
      }

      const expiresIn = Number(data.expires_in) || 86400;
      return { ok: true, accessToken: data.access_token as string, expiresIn };
    } catch (error) {
      console.warn(`[FatSecret] Error obtaining OAuth token with scope '${targetScope}':`, error);
      return { ok: false };
    }
  };

  const configuredScope = process.env.FATSECRET_SCOPE?.trim() || "basic";
  let tokenResult = await fetchTokenWithScope(configuredScope);

  // If failed with invalid_scope and scope wasn't basic, auto-retry with basic
  if (!tokenResult.ok && tokenResult.error === "invalid_scope" && configuredScope !== "basic") {
    console.info("[FatSecret] Retrying token request with fallback scope 'basic'...");
    tokenResult = await fetchTokenWithScope("basic");
  }

  if (tokenResult.ok && tokenResult.accessToken && tokenResult.expiresIn) {
    cachedToken = {
      accessToken: tokenResult.accessToken,
      expiresAt: Date.now() + tokenResult.expiresIn * 1000,
    };
    return cachedToken.accessToken;
  }

  return null;
}

interface FatSecretServing {
  serving_id?: string;
  serving_description?: string;
  metric_serving_amount?: string | number;
  metric_serving_unit?: string;
  calories?: string | number;
  carbohydrate?: string | number;
  protein?: string | number;
  fat?: string | number;
  sugar?: string | number;
  is_default?: string;
  flag_default_serving?: string;
}

interface FatSecretFood {
  food_id?: string;
  food_name?: string;
  brand_name?: string;
  food_images?: {
    food_image?: { image_url?: string } | Array<{ image_url?: string }>;
  };
  servings?: {
    serving?: FatSecretServing | FatSecretServing[];
  };
}

/**
 * Lookup food barcode on FatSecret Platform API (v2).
 * Returns normalized FoodProduct or null if not found or on error.
 */
export async function lookupFatSecret(barcode: string): Promise<FoodProduct | null> {
  const token = await getFatSecretToken();
  if (!token) {
    return null;
  }

  // Format to 13-digit GTIN-13 as required by FatSecret
  const gtin13 = barcode.length < 13 ? barcode.padStart(13, "0") : barcode;

  const tryLookup = async (code: string): Promise<FoodProduct | null> => {
    const url = new URL(FATSECRET_BARCODE_V2_URL);
    url.searchParams.append("barcode", code);
    url.searchParams.append("format", "json");
    url.searchParams.append("include_food_images", "true");
    url.searchParams.append("flag_default_serving", "true");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    // Check if FatSecret returned an error (e.g. code 211: barcode not found, code 21: invalid IP)
    if (data.error) {
      console.warn(
        `[FatSecret] API error for barcode ${code}:`,
        data.error.message || data.error,
        `(code: ${data.error.code})`
      );
      return null;
    }

    if (!data.food) {
      return null;
    }

    const food = data.food as FatSecretFood;
    const namaMakanan = String(food.food_name ?? "").trim();
    if (!namaMakanan) {
      return null;
    }

    // Extract image url
    let imageUrl: string | null = null;
    const rawImages = food.food_images?.food_image;
    if (Array.isArray(rawImages) && rawImages.length > 0) {
      imageUrl = String(rawImages[0].image_url ?? "").trim() || null;
    } else if (rawImages && typeof rawImages === "object" && "image_url" in rawImages) {
      imageUrl = String(rawImages.image_url ?? "").trim() || null;
    }

    // Extract nutrients from servings
    const rawServings = food.servings?.serving;
    const servingList: FatSecretServing[] = Array.isArray(rawServings)
      ? rawServings
      : rawServings
      ? [rawServings]
      : [];

    // Prioritize 100g serving to match standard per-100g nutrition, fallback to default or first
    const hundredGramServing = servingList.find(
      (s) =>
        String(s.metric_serving_unit ?? "").toLowerCase() === "g" &&
        Math.round(Number(s.metric_serving_amount)) === 100
    );
    const defaultServing = servingList.find(
      (s) => s.is_default === "1" || s.flag_default_serving === "1"
    );
    const chosenServing = hundredGramServing || defaultServing || servingList[0];

    return {
      barcode,
      nama_makanan: namaMakanan,
      brand: String(food.brand_name ?? "").trim() || null,
      image_url: imageUrl,
      kalori: chosenServing ? toNumber(chosenServing.calories) : null,
      protein: chosenServing ? toNumber(chosenServing.protein) : null,
      lemak: chosenServing ? toNumber(chosenServing.fat) : null,
      karbohidrat: chosenServing ? toNumber(chosenServing.carbohydrate) : null,
      gula: chosenServing ? toNumber(chosenServing.sugar) : null,
    };
  };

  try {
    // Try with GTIN-13 formatted barcode first
    let result = await tryLookup(gtin13);
    // If not found and original barcode was different, retry with exact raw barcode
    if (!result && gtin13 !== barcode) {
      result = await tryLookup(barcode);
    }
    return result;
  } catch (error) {
    console.warn("[FatSecret] Lookup error for barcode:", barcode, error);
    return null;
  }
}
