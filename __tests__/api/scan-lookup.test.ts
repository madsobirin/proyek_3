import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFoodCacheKey } from "@/lib/redis";
import * as redisModule from "@/lib/redis";
import * as openfoodfactsModule from "@/lib/openfoodfacts";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/scan-makanan/lookup/route";
import type { FoodProduct } from "@/lib/types/food";
import type { MasterMakananModel } from "@/generated/prisma/models/MasterMakanan";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    masterMakanan: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("Food Barcode Lookup with 3-Tier Search (Redis -> Master DB -> Open Food Facts)", () => {
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

  const communityProduct: MasterMakananModel = {
    id: 1,
    barcode: "089686010343",
    nama_makanan: "Chitato Sapi Panggang 68g",
    brand: "Indofood",
    image_url: "https://example.com/chitato.jpg",
    kalori: 520,
    protein: 6.7,
    lemak: 30,
    karbohidrat: 56.7,
    gula: 3.3,
    source: "community",
    contributor_id: 10,
    scan_count: 5,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.masterMakanan.update).mockResolvedValue(communityProduct);
    vi.mocked(prisma.masterMakanan.upsert).mockResolvedValue(communityProduct);
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

    it("Tier 1: should return cached data directly on cache HIT without calling Master DB or Open Food Facts", async () => {
      const getCacheSpy = vi
        .spyOn(redisModule, "getFoodFromCache")
        .mockResolvedValue(dummyProduct);
      const setCacheSpy = vi
        .spyOn(redisModule, "setFoodToCache")
        .mockResolvedValue();
      const offSpy = vi.spyOn(openfoodfactsModule, "lookupOpenFoodFacts");

      const request = new Request("http://localhost/api/scan-makanan/lookup", {
        method: "POST",
        body: JSON.stringify({ barcode: "089686010343" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Cache")).toBe("HIT");
      expect(response.headers.get("X-Data-Source")).toBe("Redis");

      const json = await response.json();
      expect(json).toEqual(dummyProduct);

      expect(getCacheSpy).toHaveBeenCalledWith("089686010343");
      expect(prisma.masterMakanan.findUnique).not.toHaveBeenCalled();
      expect(offSpy).not.toHaveBeenCalled();
      expect(setCacheSpy).not.toHaveBeenCalled();
    });

    it("Tier 2: should return community data from Master DB on cache MISS and cache to Redis", async () => {
      vi.spyOn(redisModule, "getFoodFromCache").mockResolvedValue(null);
      const setCacheSpy = vi
        .spyOn(redisModule, "setFoodToCache")
        .mockResolvedValue();
      vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue(communityProduct);
      const offSpy = vi.spyOn(openfoodfactsModule, "lookupOpenFoodFacts");

      const request = new Request("http://localhost/api/scan-makanan/lookup", {
        method: "POST",
        body: JSON.stringify({ barcode: "089686010343" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Cache")).toBe("MISS");
      expect(response.headers.get("X-Data-Source")).toBe("FitLife-Community");

      const json = await response.json();
      expect(json.nama_makanan).toBe(communityProduct.nama_makanan);
      expect(json.barcode).toBe(communityProduct.barcode);

      expect(prisma.masterMakanan.findUnique).toHaveBeenCalledWith({
        where: { barcode: "089686010343" },
      });
      expect(setCacheSpy).toHaveBeenCalledWith("089686010343", expect.objectContaining({
        barcode: "089686010343",
        nama_makanan: "Chitato Sapi Panggang 68g",
      }));
      expect(offSpy).not.toHaveBeenCalled();
    });

    it("Tier 3: should call Open Food Facts on cache MISS & DB MISS, then save to Master DB and Redis", async () => {
      vi.spyOn(redisModule, "getFoodFromCache").mockResolvedValue(null);
      vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue(null);
      const setCacheSpy = vi
        .spyOn(redisModule, "setFoodToCache")
        .mockResolvedValue();
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

      expect(offSpy).toHaveBeenCalledWith("089686010343");
      expect(prisma.masterMakanan.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { barcode: "089686010343" },
      }));
      expect(setCacheSpy).toHaveBeenCalledWith("089686010343", dummyProduct);
    });

    it("Tier 4: should return 404 when product is not found in cache, Master DB, or Open Food Facts", async () => {
      vi.spyOn(redisModule, "getFoodFromCache").mockResolvedValue(null);
      vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue(null);
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
