import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GET as handleGetList,
  POST as handleCreate,
} from "@/app/api/admin/master-makanan/route";
import {
  GET as handleGetDetail,
  PUT as handleUpdate,
  DELETE as handleDelete,
} from "@/app/api/admin/master-makanan/[id]/route";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as redisModule from "@/lib/redis";
import type { MasterMakananModel } from "@/generated/prisma/models/MasterMakanan";

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    masterMakanan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    del: vi.fn(),
  },
  getFoodCacheKey: vi.fn((barcode: string) => `food:barcode:${barcode.trim()}`),
  setFoodToCache: vi.fn(),
}));

describe("Admin Master Makanan API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockAdminUser = {
    userId: 1,
    role: "admin",
    email: "admin@fitlife.com",
  };

  const mockRegularUser = {
    userId: 2,
    role: "user",
    email: "user@fitlife.com",
  };

  describe("GET /api/admin/master-makanan", () => {
    it("should return 401 when unauthenticated", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(null);

      const request = new Request("http://localhost/api/admin/master-makanan");
      const res = await handleGetList(request);
      expect(res.status).toBe(401);
    });

    it("should return 403 when role is not admin", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(mockRegularUser);

      const request = new Request("http://localhost/api/admin/master-makanan");
      const res = await handleGetList(request);
      expect(res.status).toBe(403);
    });

    it("should return 200 with list, pagination, and stats for admin", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(mockAdminUser);

      const mockFoodItem = {
        id: 1,
        barcode: "8992388123456",
        nama_makanan: "Susu UHT",
        brand: "Ultra Milk",
        image_url: null,
        kalori: 120,
        protein: 6,
        lemak: 4,
        karbohidrat: 14,
        gula: 10,
        source: "verified",
        contributor_id: 1,
        scan_count: 5,
        created_at: new Date(),
        updated_at: new Date(),
        contributor: {
          id: 1,
          name: "Admin User",
          email: "admin@fitlife.com",
        },
      };

      vi.mocked(prisma.masterMakanan.findMany).mockResolvedValue([
        mockFoodItem as unknown as MasterMakananModel,
      ]);
      vi.mocked(prisma.masterMakanan.count)
        .mockResolvedValueOnce(1) // totalFiltered
        .mockResolvedValueOnce(1) // totalAll
        .mockResolvedValueOnce(1) // verifiedCount
        .mockResolvedValueOnce(0) // communityCount
        .mockResolvedValueOnce(0); // offCount
      vi.mocked(prisma.masterMakanan.aggregate).mockResolvedValue({
        _sum: { scan_count: 5 },
      } as unknown as Awaited<ReturnType<typeof prisma.masterMakanan.aggregate>>);

      const request = new Request(
        "http://localhost/api/admin/master-makanan?page=1&limit=10&source=verified",
      );
      const res = await handleGetList(request);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
      expect(body.stats.verified).toBe(1);
      expect(body.stats.totalScans).toBe(5);
    });
  });

  describe("POST /api/admin/master-makanan", () => {
    it("should return 401 when unauthenticated", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(null);

      const request = new Request("http://localhost/api/admin/master-makanan", {
        method: "POST",
        body: JSON.stringify({ barcode: "12345678", nama_makanan: "Apel" }),
      });
      const res = await handleCreate(request);
      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid barcode format", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(mockAdminUser);

      const request = new Request("http://localhost/api/admin/master-makanan", {
        method: "POST",
        body: JSON.stringify({ barcode: "12", nama_makanan: "Apel" }),
      });
      const res = await handleCreate(request);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain("Barcode");
    });

    it("should return 409 if barcode already exists", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(mockAdminUser);
      vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue({
        id: 1,
        barcode: "12345678",
      } as unknown as MasterMakananModel);

      const request = new Request("http://localhost/api/admin/master-makanan", {
        method: "POST",
        body: JSON.stringify({ barcode: "12345678", nama_makanan: "Apel" }),
      });
      const res = await handleCreate(request);
      expect(res.status).toBe(409);
    });

    it("should create verified product and update Redis cache", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(mockAdminUser);
      vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue(null);

      const createdItem: MasterMakananModel = {
        id: 10,
        barcode: "8992388123456",
        nama_makanan: "Susu Kedelai",
        brand: "FitLife",
        image_url: null,
        kalori: 100,
        protein: 7,
        lemak: 3,
        karbohidrat: 12,
        gula: 4,
        source: "verified",
        contributor_id: 1,
        scan_count: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(prisma.masterMakanan.create).mockResolvedValue(createdItem);

      const request = new Request("http://localhost/api/admin/master-makanan", {
        method: "POST",
        body: JSON.stringify({
          barcode: "8992388123456",
          nama_makanan: "Susu Kedelai",
          brand: "FitLife",
          kalori: 100,
          protein: 7,
          lemak: 3,
          karbohidrat: 12,
          gula: 4,
          source: "verified",
        }),
      });

      const res = await handleCreate(request);
      expect(res.status).toBe(201);
      expect(redisModule.setFoodToCache).toHaveBeenCalledWith(
        "8992388123456",
        expect.objectContaining({
          nama_makanan: "Susu Kedelai",
          source: "verified",
        }),
      );
    });
  });

  describe("GET /api/admin/master-makanan/[id]", () => {
    it("should return 404 when product not found", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(mockAdminUser);
      vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue(null);

      const request = new Request("http://localhost/api/admin/master-makanan/999");
      const res = await handleGetDetail(request, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(res.status).toBe(404);
    });

    it("should return 200 with product data", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(mockAdminUser);
      const detailItem = {
        id: 5,
        barcode: "8992388123456",
        nama_makanan: "Chitato",
        source: "community",
      };
      vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue(
        detailItem as unknown as MasterMakananModel,
      );

      const request = new Request("http://localhost/api/admin/master-makanan/5");
      const res = await handleGetDetail(request, {
        params: Promise.resolve({ id: "5" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.nama_makanan).toBe("Chitato");
    });
  });

  describe("PUT & DELETE /api/admin/master-makanan/[id]", () => {
    it("PUT should update product, verify, and update Redis cache", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(mockAdminUser);
      vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue({
        id: 5,
        barcode: "8992388123456",
        nama_makanan: "Chitato",
        source: "community",
      } as unknown as MasterMakananModel);

      vi.mocked(prisma.masterMakanan.update).mockResolvedValue({
        id: 5,
        barcode: "8992388123456",
        nama_makanan: "Chitato Revisi",
        brand: "Indofood",
        image_url: null,
        kalori: 500,
        protein: 7,
        lemak: 28,
        karbohidrat: 55,
        gula: 3,
        source: "verified",
        contributor_id: null,
        scan_count: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new Request("http://localhost/api/admin/master-makanan/5", {
        method: "PUT",
        body: JSON.stringify({
          nama_makanan: "Chitato Revisi",
          source: "verified",
        }),
      });

      const res = await handleUpdate(request, {
        params: Promise.resolve({ id: "5" }),
      });
      expect(res.status).toBe(200);
      expect(redisModule.setFoodToCache).toHaveBeenCalledWith(
        "8992388123456",
        expect.objectContaining({
          nama_makanan: "Chitato Revisi",
          source: "verified",
        }),
      );
    });

    it("DELETE should remove product and delete Redis cache", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(mockAdminUser);
      vi.mocked(prisma.masterMakanan.findUnique).mockResolvedValue({
        id: 5,
        barcode: "8992388123456",
      } as unknown as MasterMakananModel);
      vi.mocked(prisma.masterMakanan.delete).mockResolvedValue({
        id: 5,
        barcode: "8992388123456",
        nama_makanan: "Chitato",
        brand: null,
        image_url: null,
        kalori: null,
        protein: null,
        lemak: null,
        karbohidrat: null,
        gula: null,
        source: "community",
        contributor_id: null,
        scan_count: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new Request("http://localhost/api/admin/master-makanan/5", {
        method: "DELETE",
      });

      const res = await handleDelete(request, {
        params: Promise.resolve({ id: "5" }),
      });
      expect(res.status).toBe(200);
      expect(prisma.masterMakanan.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(redisModule.redis?.del).toHaveBeenCalledWith(
        "food:barcode:8992388123456",
      );
    });
  });
});
