import { describe, it, expect } from "vitest";
import {
  SignupFormSchema,
  LoginFormSchema,
  MenuSchema,
  ArtikelSchema,
} from "@/lib/definition";

// ─── SignupFormSchema ─────────────────────────────────────────────────────────
describe("SignupFormSchema", () => {
  const validData = {
    name: "Budi Santoso",
    email: "budi@example.com",
    password: "Password123",
  };

  it("should pass with valid data", () => {
    const result = SignupFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail when name is too short (< 2 chars)", () => {
    const result = SignupFormSchema.safeParse({ ...validData, name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it("should fail with invalid email format", () => {
    const result = SignupFormSchema.safeParse({
      ...validData,
      email: "bukan-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it("should fail when password is too short (< 8 chars)", () => {
    const result = SignupFormSchema.safeParse({
      ...validData,
      password: "Ab1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });

  it("should fail when password has no letters", () => {
    const result = SignupFormSchema.safeParse({
      ...validData,
      password: "12345678",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });

  it("should fail when password has no numbers", () => {
    const result = SignupFormSchema.safeParse({
      ...validData,
      password: "PasswordOnly",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });
});

// ─── LoginFormSchema ──────────────────────────────────────────────────────────
describe("LoginFormSchema", () => {
  const validData = {
    email: "budi@example.com",
    password: "rahasia123",
  };

  it("should pass with valid credentials", () => {
    const result = LoginFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail with invalid email", () => {
    const result = LoginFormSchema.safeParse({
      ...validData,
      email: "bukanEmail",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it("should fail when password is empty", () => {
    const result = LoginFormSchema.safeParse({ ...validData, password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });
});

// ─── MenuSchema ───────────────────────────────────────────────────────────────
describe("MenuSchema", () => {
  const validMenu = {
    nama_menu: "Nasi Goreng Spesial",
    deskripsi: "Nasi goreng dengan bumbu rempah pilihan dan lauk pelengkap.",
    kalori: 450,
    target_status: "Normal" as const,
    waktu_memasak: 30,
    gambar: "https://example.com/images/nasi-goreng.jpg",
  };

  it("should pass with valid menu data", () => {
    const result = MenuSchema.safeParse(validMenu);
    expect(result.success).toBe(true);
  });

  it("should fail when nama_menu is too short (< 3 chars)", () => {
    const result = MenuSchema.safeParse({ ...validMenu, nama_menu: "Mi" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.nama_menu).toBeDefined();
    }
  });

  it("should fail when deskripsi is too short (< 10 chars)", () => {
    const result = MenuSchema.safeParse({ ...validMenu, deskripsi: "Enak" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.deskripsi).toBeDefined();
    }
  });

  it("should fail when kalori exceeds maximum (10000)", () => {
    const result = MenuSchema.safeParse({ ...validMenu, kalori: 99999 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.kalori).toBeDefined();
    }
  });

  it("should fail when kalori is negative", () => {
    const result = MenuSchema.safeParse({ ...validMenu, kalori: -10 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.kalori).toBeDefined();
    }
  });

  it("should fail when target_status is invalid", () => {
    const result = MenuSchema.safeParse({
      ...validMenu,
      target_status: "Gemuk",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.target_status).toBeDefined();
    }
  });

  it("should accept all valid target_status values", () => {
    const statuses = ["Kurus", "Normal", "Berlebih", "Obesitas"] as const;
    for (const status of statuses) {
      const result = MenuSchema.safeParse({
        ...validMenu,
        target_status: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should fail when gambar is not a valid URL", () => {
    const result = MenuSchema.safeParse({
      ...validMenu,
      gambar: "bukan-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.gambar).toBeDefined();
    }
  });

  it("should fail when waktu_memasak exceeds 1440 minutes", () => {
    const result = MenuSchema.safeParse({
      ...validMenu,
      waktu_memasak: 1441,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.waktu_memasak).toBeDefined();
    }
  });
});

// ─── ArtikelSchema ────────────────────────────────────────────────────────────
describe("ArtikelSchema", () => {
  const validArtikel = {
    judul: "Tips Hidup Sehat untuk Pemula",
    kategori: "Kesehatan",
    penulis: "Admin FitLife",
    isi: "Hidup sehat adalah impian semua orang. Berikut adalah beberapa tips untuk memulai gaya hidup sehat yang dapat dipraktikkan sehari-hari.",
    gambar: "https://example.com/images/artikel.jpg",
    is_featured: false,
  };

  it("should pass with valid artikel data", () => {
    const result = ArtikelSchema.safeParse(validArtikel);
    expect(result.success).toBe(true);
  });

  it("should use default values when penulis and is_featured are omitted", () => {
    const partial = {
      judul: validArtikel.judul,
      kategori: validArtikel.kategori,
      isi: validArtikel.isi,
      gambar: validArtikel.gambar,
    };
    const result = ArtikelSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.penulis).toBe("Admin");
      expect(result.data.is_featured).toBe(false);
    }
  });

  it("should fail when judul is too short (< 5 chars)", () => {
    const result = ArtikelSchema.safeParse({ ...validArtikel, judul: "Tips" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.judul).toBeDefined();
    }
  });

  it("should fail when judul exceeds 300 chars", () => {
    const result = ArtikelSchema.safeParse({
      ...validArtikel,
      judul: "A".repeat(301),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.judul).toBeDefined();
    }
  });

  it("should fail when isi is too short (< 20 chars)", () => {
    const result = ArtikelSchema.safeParse({
      ...validArtikel,
      isi: "Terlalu pendek.",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.isi).toBeDefined();
    }
  });

  it("should fail when gambar is not a valid URL", () => {
    const result = ArtikelSchema.safeParse({
      ...validArtikel,
      gambar: "bukan-url-valid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.gambar).toBeDefined();
    }
  });

  it("should fail when kategori is too short (< 3 chars)", () => {
    const result = ArtikelSchema.safeParse({
      ...validArtikel,
      kategori: "IT",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.kategori).toBeDefined();
    }
  });
});
