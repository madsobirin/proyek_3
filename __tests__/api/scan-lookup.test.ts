import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFoodCacheKey } from "@/lib/redis";
import * as redisModule from "@/lib/redis";
import * as fatsecretModule from "@/lib/fatsecret";
import * as openfoodfactsModule from "@/lib/openfoodfacts";
import { POST } from "@/app/api/scan-makanan/lookup/route";
import type { FoodProduct } from "@/lib/types/food";

describe("Food Barcode Lookup with Redis Cache & Fallback", () => {
  const dummyProduct: FoodProduct = {
    barcode: "089686010343",
    nama_makanan: "Chitato Sapi Panggang 68g",
    brand: "Indofood",
    image_url: "https://example.com/chitato.jpg",
    kalori: 520,
    protein: 6.7,
    lemak: 30,
    karbohidrat: 56.7,
    gula: 3.3,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Redis Key format", () => {
    it("should format key based on barcode only as food:barcode:<barcode>", () => {
      expect(getFoodCacheKey("089686010343")).toBe("food:barcode:089686010343");
      expect(getFoodCacheKey(" 12345678 ")).toBe("food:barcode:12345678");
    });
  });

  describe("POST /api/scan-makanan/lookup", () => {
    it("should reject invalid barcode with 400", async () => {
      const request = new Request("http://localhost/api/scan-makanan/lookup", {
        method: "POST",
        body: JSON.stringify({ barcode: "abc" }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toContain("Barcode harus berisi");
    });

    it("should return cached data directly on cache HIT without calling FatSecret or OpenFoodFacts", async () => {
      const getCacheSpy = vi
        .spyOn(redisModule, "getFoodFromCache")
        .mockResolvedValue(dummyProduct);
      const setCacheSpy = vi
        .spyOn(redisModule, "setFoodToCache")
        .mockResolvedValue();
      const fatsecretSpy = vi.spyOn(fatsecretModule, "lookupFatSecret");
      const offSpy = vi.spyOn(openfoodfactsModule, "lookupOpenFoodFacts");

      const request = new Request("http://localhost/api/scan-makanan/lookup", {
        method: "POST",
        body: JSON.stringify({ barcode: "089686010343" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Cache")).toBe("HIT");

      const json = await response.json();
      expect(json).toEqual(dummyProduct);

      // Verify Redis check
      expect(getCacheSpy).toHaveBeenCalledWith("089686010343");
      // MUST NOT call FatSecret or OpenFoodFacts
      expect(fatsecretSpy).not.toHaveBeenCalled();
      expect(offSpy).not.toHaveBeenCalled();
      expect(setCacheSpy).not.toHaveBeenCalled();
    });

    it("should call FatSecret on cache MISS and save to Redis if found", async () => {
      vi.spyOn(redisModule, "getFoodFromCache").mockResolvedValue(null);
      const setCacheSpy = vi
        .spyOn(redisModule, "setFoodToCache")
        .mockResolvedValue();
      const fatsecretSpy = vi
        .spyOn(fatsecretModule, "lookupFatSecret")
        .mockResolvedValue(dummyProduct);
      const offSpy = vi.spyOn(openfoodfactsModule, "lookupOpenFoodFacts");

      const request = new Request("http://localhost/api/scan-makanan/lookup", {
        method: "POST",
        body: JSON.stringify({ barcode: "089686010343" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Cache")).toBe("MISS");
      expect(response.headers.get("X-Data-Source")).toBe("FatSecret");

      const json = await response.json();
      expect(json).toEqual(dummyProduct);

      expect(fatsecretSpy).toHaveBeenCalledWith("089686010343");
      expect(setCacheSpy).toHaveBeenCalledWith("089686010343", dummyProduct);
      // OpenFoodFacts not called because FatSecret succeeded
      expect(offSpy).not.toHaveBeenCalled();
    });

    it("should fallback to Open Food Facts when FatSecret returns null and save to Redis", async () => {
      vi.spyOn(redisModule, "getFoodFromCache").mockResolvedValue(null);
      const setCacheSpy = vi
        .spyOn(redisModule, "setFoodToCache")
        .mockResolvedValue();
      const fatsecretSpy = vi
        .spyOn(fatsecretModule, "lookupFatSecret")
        .mockResolvedValue(null);
      const offSpy = vi
        .spyOn(openfoodfactsModule, "lookupOpenFoodFacts")
        .mockResolvedValue(dummyProduct);

      const request = new Request("http://localhost/api/scan-makanan/lookup", {
        method: "POST",
        body: JSON.stringify({ barcode: "089686010343" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Cache")).toBe("MISS");
      expect(response.headers.get("X-Data-Source")).toBe("OpenFoodFacts");

      const json = await response.json();
      expect(json).toEqual(dummyProduct);

      expect(fatsecretSpy).toHaveBeenCalledWith("089686010343");
      expect(offSpy).toHaveBeenCalledWith("089686010343");
      expect(setCacheSpy).toHaveBeenCalledWith("089686010343", dummyProduct);
    });

    it("should return 404 when product is not found in either API", async () => {
      vi.spyOn(redisModule, "getFoodFromCache").mockResolvedValue(null);
      vi.spyOn(fatsecretModule, "lookupFatSecret").mockResolvedValue(null);
      vi.spyOn(openfoodfactsModule, "lookupOpenFoodFacts").mockResolvedValue(null);

      const request = new Request("http://localhost/api/scan-makanan/lookup", {
        method: "POST",
        body: JSON.stringify({ barcode: "999999999999" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.message).toBe("Produk dengan barcode tersebut tidak ditemukan");
    });
  });
});
