import { describe, it, expect } from "vitest";
import {
  hitungAnalisisKesehatan,
  formatKesehatanUI,
  getFaktorAktivitas,
} from "@/lib/kesehatan";

/**
 * Pengujian Unit Lengkap: Analisis Kesehatan & Nutrisi FitLife
 *
 * Menguji:
 * 1. BMI & Status Klasifikasi
 * 2. BMR Mifflin-St Jeor (Pria & Wanita)
 * 3. Faktor Aktivitas TDEE (1.2, 1.375, 1.55, 1.725, 1.9)
 * 4. Kisaran Berat Badan Ideal (18.5 - 24.9)
 * 5. Distribusi Makronutrien (Protein, Lemak, Karbohidrat dari sisa kalori)
 * 6. Kasus Spesifik Evaluasi User:
 *    TB 171 cm, BB 65 kg, Pria, Usia 20, Aktivitas Sedang (Moderate 1.55)
 *    -> BMI ≈ 22.2, BMR ≈ 1624 kcal, TDEE ≈ 2517 kcal, kisaran 54.1–72.8 kg,
 *       protein ≈ 91 g, lemak ≈ 84 g, karbohidrat ≈ 349 g.
 */

// ─── 1. Kasus Spesifik Evaluasi User ──────────────────────────────────────────
describe("Kasus Evaluasi User (TB 171 cm, BB 65 kg, Pria, Usia 20, Sedang)", () => {
  it("should match exactly all target values with proper UI rounding and full precision calculation", () => {
    const hasil = hitungAnalisisKesehatan({
      tinggi: 171,
      berat: 65,
      gender: "pria",
      usia: 20,
      aktivitas: "sedang",
    });

    // Full precision checks
    // TB = 1.71m -> TB^2 = 2.9241
    // BMI = 65 / 2.9241 = 22.22906...
    expect(hasil.bmi).toBeCloseTo(22.23, 2);
    expect(hasil.status).toBe("Normal");

    // BMR = 10*65 + 6.25*171 - 5*20 + 5 = 650 + 1068.75 - 100 + 5 = 1623.75
    expect(hasil.bmr).toBe(1623.75);

    // TDEE = 1623.75 * 1.55 = 2516.8125
    expect(hasil.tdee).toBe(2516.8125);

    // Kisaran Berat: 18.5 * 2.9241 = 54.09585, 24.9 * 2.9241 = 72.81009
    expect(hasil.berat_min).toBeCloseTo(54.1, 1);
    expect(hasil.berat_max).toBeCloseTo(72.81, 1);

    // Protein = 65 * 1.4 = 91
    expect(hasil.protein).toBe(91);

    // Lemak = 2516.8125 * 0.3 / 9 = 83.89375
    expect(hasil.lemak).toBeCloseTo(83.89, 2);

    // Karbohidrat = (2516.8125 - 91*4 - 83.89375*9) / 4 = 1397.76875 / 4 = 349.4421875
    expect(hasil.karbohidrat).toBeCloseTo(349.44, 2);

    // UI Formatted Output Verification
    const ui = formatKesehatanUI(hasil);
    expect(ui.bmi).toBe("22.2");
    expect(ui.status).toBe("Normal");
    expect(ui.bmr).toBe(1624);
    expect(ui.tdee).toBe(2517);
    expect(ui.kisaran_berat).toBe("54.1 – 72.8 kg");
    expect(ui.protein).toBe(91);
    expect(ui.lemak).toBe(84);
    expect(ui.karbohidrat).toBe(349);
  });
});

// ─── 2. BMI & Klasifikasi Status ──────────────────────────────────────────────
describe("BMI Calculation & Status Logic", () => {
  it("should classify BMI < 18.5 as Kurus", () => {
    const hasil = hitungAnalisisKesehatan({
      tinggi: 170,
      berat: 45,
      gender: "pria",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.status).toBe("Kurus");
    expect(hasil.bmi).toBeLessThan(18.5);
  });

  it("should classify BMI exactly 18.5 as Normal", () => {
    const tinggi = 170;
    const berat = 18.5 * Math.pow(tinggi / 100, 2);
    const hasil = hitungAnalisisKesehatan({
      tinggi,
      berat,
      gender: "pria",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.status).toBe("Normal");
  });

  it("should classify BMI 18.5 to < 25 as Normal", () => {
    const hasil = hitungAnalisisKesehatan({
      tinggi: 175,
      berat: 70,
      gender: "pria",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.status).toBe("Normal");
    expect(hasil.bmi).toBeGreaterThanOrEqual(18.5);
    expect(hasil.bmi).toBeLessThan(25);
  });

  it("should classify BMI 25 to < 30 as Berlebih", () => {
    const tinggi = 170;
    const berat = 25 * Math.pow(tinggi / 100, 2);
    const hasil = hitungAnalisisKesehatan({
      tinggi,
      berat,
      gender: "pria",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.status).toBe("Berlebih");
  });

  it("should classify BMI >= 30 as Obesitas", () => {
    const tinggi = 170;
    const berat = 30 * Math.pow(tinggi / 100, 2);
    const hasil = hitungAnalisisKesehatan({
      tinggi,
      berat,
      gender: "pria",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.status).toBe("Obesitas");
  });
});

// ─── 3. BMR Mifflin-St Jeor (Pria & Wanita) ───────────────────────────────────
describe("BMR Mifflin-St Jeor Calculation", () => {
  it("should calculate BMR correctly for Pria (10×BB + 6.25×TB - 5×usia + 5)", () => {
    // 170cm, 65kg, 25th pria: 650 + 1062.5 - 125 + 5 = 1592.5
    const hasil = hitungAnalisisKesehatan({
      tinggi: 170,
      berat: 65,
      gender: "pria",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.bmr).toBe(1592.5);
    expect(Math.round(hasil.bmr)).toBe(1593);
  });

  it("should calculate BMR correctly for Wanita (10×BB + 6.25×TB - 5×usia - 161)", () => {
    // 160cm, 50kg, 25th wanita: 500 + 1000 - 125 - 161 = 1214
    const hasil = hitungAnalisisKesehatan({
      tinggi: 160,
      berat: 50,
      gender: "wanita",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.bmr).toBe(1214);
    expect(Math.round(hasil.bmr)).toBe(1214);
  });

  it("should handle perempuan alias for gender wanita", () => {
    const hasil = hitungAnalisisKesehatan({
      tinggi: 160,
      berat: 50,
      gender: "perempuan",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.bmr).toBe(1214);
  });
});

// ─── 4. Semua Faktor Aktivitas TDEE ───────────────────────────────────────────
describe("TDEE Activity Multipliers", () => {
  const bmrBase = 1000; // Contoh basis BMR untuk menguji multiplier
  // TB 160, BB 40, Wanita, Usia 27.8 -> BMR = 400 + 1000 - 139 - 161 = 1100
  it("should map sedentary / rebahan to factor 1.2", () => {
    expect(getFaktorAktivitas("sedentary")).toBe(1.2);
    expect(getFaktorAktivitas("rebahan")).toBe(1.2);
  });

  it("should map light / ringan to factor 1.375", () => {
    expect(getFaktorAktivitas("light")).toBe(1.375);
    expect(getFaktorAktivitas("ringan")).toBe(1.375);
  });

  it("should map moderate / sedang to factor 1.55", () => {
    expect(getFaktorAktivitas("moderate")).toBe(1.55);
    expect(getFaktorAktivitas("sedang")).toBe(1.55);
  });

  it("should map active / berat to factor 1.725", () => {
    expect(getFaktorAktivitas("active")).toBe(1.725);
    expect(getFaktorAktivitas("berat")).toBe(1.725);
  });

  it("should map very_active / sangat_aktif to factor 1.9", () => {
    expect(getFaktorAktivitas("very_active")).toBe(1.9);
    expect(getFaktorAktivitas("very active")).toBe(1.9);
    expect(getFaktorAktivitas("sangat_aktif")).toBe(1.9);
  });

  it("should compute accurate TDEE for very active (1.9)", () => {
    const hasil = hitungAnalisisKesehatan({
      tinggi: 170,
      berat: 65,
      gender: "pria",
      usia: 25,
      aktivitas: "very_active",
    });
    // BMR 1592.5 * 1.9 = 3025.75
    expect(hasil.tdee).toBe(1592.5 * 1.9);
    expect(Math.round(hasil.tdee)).toBe(3026);
  });
});

// ─── 5. Kisaran Berat Berdasarkan BMI ─────────────────────────────────────────
describe("Kisaran Berat Berdasarkan BMI", () => {
  it("should calculate berat_min = 18.5 × TB(m)² and berat_max = 24.9 × TB(m)²", () => {
    const tinggi = 180; // 1.8m -> 1.8^2 = 3.24
    const hasil = hitungAnalisisKesehatan({
      tinggi,
      berat: 75,
      gender: "pria",
      usia: 30,
      aktivitas: "sedang",
    });

    // 18.5 * 3.24 = 59.94
    expect(hasil.berat_min).toBeCloseTo(59.94, 2);
    // 24.9 * 3.24 = 80.676
    expect(hasil.berat_max).toBeCloseTo(80.676, 2);
  });
});

// ─── 6. Distribusi Makronutrien ───────────────────────────────────────────────
describe("Makronutrien Calculation (Protein, Lemak, Karbohidrat)", () => {
  it("should calculate protein as BB × 1.4 g/hari", () => {
    const hasil = hitungAnalisisKesehatan({
      tinggi: 170,
      berat: 80,
      gender: "pria",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.protein).toBe(80 * 1.4); // 112
  });

  it("should calculate lemak as (TDEE × 30%) / 9", () => {
    const hasil = hitungAnalisisKesehatan({
      tinggi: 170,
      berat: 80,
      gender: "pria",
      usia: 25,
      aktivitas: "sedang",
    });
    expect(hasil.lemak).toBe((hasil.tdee * 0.3) / 9);
  });

  it("should calculate karbohidrat as (TDEE - protein×4 - lemak×9) / 4", () => {
    const hasil = hitungAnalisisKesehatan({
      tinggi: 170,
      berat: 80,
      gender: "pria",
      usia: 25,
      aktivitas: "sedang",
    });
    const expectedCarb = (hasil.tdee - hasil.protein * 4 - hasil.lemak * 9) / 4;
    expect(hasil.karbohidrat).toBeCloseTo(expectedCarb, 4);

    // Verifikasi jumlah kalori total makro sama persis dengan TDEE
    const totalKaloriMakro = hasil.protein * 4 + hasil.lemak * 9 + hasil.karbohidrat * 4;
    expect(totalKaloriMakro).toBeCloseTo(hasil.tdee, 5);
  });
});

// ─── 7. Validasi Input ────────────────────────────────────────────────────────
describe("Input Validation Logic", () => {
  function isValidInput(tinggi_badan: unknown, berat_badan: unknown): boolean {
    if (!tinggi_badan || !berat_badan) return false;
    const tinggi = parseFloat(String(tinggi_badan));
    const berat = parseFloat(String(berat_badan));
    if (isNaN(tinggi) || isNaN(berat) || tinggi <= 0 || berat <= 0)
      return false;
    return true;
  }

  it("should return false when tinggi_badan is missing", () => {
    expect(isValidInput(undefined, 70)).toBe(false);
  });

  it("should return false when berat_badan is missing", () => {
    expect(isValidInput(170, undefined)).toBe(false);
  });

  it("should return false when tinggi_badan is zero", () => {
    expect(isValidInput(0, 70)).toBe(false);
  });

  it("should return false when berat_badan is negative", () => {
    expect(isValidInput(170, -5)).toBe(false);
  });

  it("should return false for non-numeric strings", () => {
    expect(isValidInput("seratus", 70)).toBe(false);
  });

  it("should return true for valid string numbers", () => {
    expect(isValidInput("170", "70")).toBe(true);
  });

  it("should return true for valid numeric inputs", () => {
    expect(isValidInput(175, 65)).toBe(true);
  });
});
