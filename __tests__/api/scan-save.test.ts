import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as handleSave } from "@/app/api/scan-makanan/save/route";
import { POST as handleUpload } from "@/app/api/scan-makanan/upload/route";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as redisModule from "@/lib/redis";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import type { ScanMakananModel } from "@/generated/prisma/models/ScanMakanan";
import type { MasterMakananModel } from "@/generated/prisma/models/MasterMakanan";

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scanMakanan: {
      create: vi.fn(),
    },
    masterMakanan: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(),
    },
  },
}));

describe("POST /api/scan-makanan/save", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 401 if unauthenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/scan-makanan/save", {
      method: "POST",
      body: JSON.stringify({ barcode: "12345678", nama_makanan: "Apel" }),
    });

    const response = await handleSave(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid barcode or missing food name", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: 1,
      role: "user",
      email: "test@fitlife.com",
    });

    const request = new Request("http://localhost/api/scan-makanan/save", {
      method: "POST",
      body: JSON.stringify({ barcode: "abc", nama_makanan: "" }),
    });

    const response = await handleSave(request);
    expect(response.status).toBe(400);
  });

  it("should save user history, upsert master database, and cache in Redis", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: 5,
      role: "user",
      email: "contributor@fitlife.com",
    });

    const mockScanResult: ScanMakananModel = {
      id: 101,
      user_id: 5,
      barcode: "8992388123456",
      nama_makanan: "Susu UHT Cokelat 250ml",
      brand: "Ultra Milk",
      image_url: "https://example.com/susu.jpg",
      kalori: 160,
      protein: 5,
      lemak: 4.5,
      karbohidrat: 24,
      gula: 18,
      created_at: new Date(),
    };

    const mockMasterResult: MasterMakananModel = {
      id: 202,
      barcode: "8992388123456",
      nama_makanan: "Susu UHT Cokelat 250ml",
      brand: "Ultra Milk",
      image_url: "https://example.com/susu.jpg",
      kalori: 160,
      protein: 5,
      lemak: 4.5,
      karbohidrat: 24,
      gula: 18,
      source: "community",
      contributor_id: 5,
      scan_count: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.mocked(prisma.scanMakanan.create).mockResolvedValue(mockScanResult);
    vi.mocked(prisma.masterMakanan.upsert).mockResolvedValue(mockMasterResult);
    const setCacheSpy = vi.spyOn(redisModule, "setFoodToCache").mockResolvedValue();

    const request = new Request("http://localhost/api/scan-makanan/save", {
      method: "POST",
      body: JSON.stringify({
        barcode: "8992388123456",
        nama_makanan: "Susu UHT Cokelat 250ml",
        brand: "Ultra Milk",
        image_url: "https://example.com/susu.jpg",
        kalori: 160,
        protein: 5,
        lemak: 4.5,
        karbohidrat: 24,
        gula: 18,
      }),
    });

    const response = await handleSave(request);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.message).toContain("berhasil disimpan dan dibagikan ke komunitas");
    expect(json.data.nama_makanan).toBe("Susu UHT Cokelat 250ml");

    // Verify Master DB upsert
    expect(prisma.masterMakanan.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { barcode: "8992388123456" },
        create: expect.objectContaining({
          barcode: "8992388123456",
          source: "community",
          contributor_id: 5,
        }),
      }),
    );

    // Verify Redis cache set
    expect(setCacheSpy).toHaveBeenCalledWith("8992388123456", expect.objectContaining({
      barcode: "8992388123456",
      nama_makanan: "Susu UHT Cokelat 250ml",
    }));
  });
});

describe("POST /api/scan-makanan/upload", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 401 if unauthenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);

    const formData = new FormData();
    const request = new Request("http://localhost/api/scan-makanan/upload", {
      method: "POST",
      body: formData,
    });

    const response = await handleUpload(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 if image file is missing", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: 1,
      role: "user",
      email: "user@fitlife.com",
    });

    const formData = new FormData();
    const request = new Request("http://localhost/api/scan-makanan/upload", {
      method: "POST",
      body: formData,
    });

    const response = await handleUpload(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toContain("File gambar tidak ditemukan");
  });

  it("should return 400 if file type is unsupported", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: 1,
      role: "user",
      email: "user@fitlife.com",
    });

    const formData = new FormData();
    const blob = new Blob(["sample text"], { type: "text/plain" });
    formData.append("image", blob, "test.txt");

    const request = new Request("http://localhost/api/scan-makanan/upload", {
      method: "POST",
      body: formData,
    });

    const response = await handleUpload(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toContain("Tipe file tidak didukung");
  });

  it("should upload to Cloudinary folder fitlife/foods and return secure_url", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: 7,
      role: "user",
      email: "user@fitlife.com",
    });

    vi.mocked(cloudinary.uploader.upload).mockResolvedValue({
      secure_url: "https://res.cloudinary.com/fitlife/foods/food_123.jpg",
    } as unknown as UploadApiResponse);

    const formData = new FormData();
    const blob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    formData.append("image", blob, "food.jpg");

    const request = new Request("http://localhost/api/scan-makanan/upload", {
      method: "POST",
      body: formData,
    });

    const response = await handleUpload(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.url).toBe("https://res.cloudinary.com/fitlife/foods/food_123.jpg");
    expect(json.image_url).toBe("https://res.cloudinary.com/fitlife/foods/food_123.jpg");
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
      expect.stringContaining("data:image/jpeg;base64,"),
      expect.objectContaining({
        folder: "fitlife/foods",
      }),
    );
  });
});
