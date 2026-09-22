/**
 * Modul Terpusat: Analisis Kesehatan & Nutrisi (FitLife)
 *
 * Rumus:
 * - BMI = berat / (tinggi/100)²
 *   Status: < 18.5 Kurus, 18.5–< 25 Normal, 25–< 30 Berlebih, ≥ 30 Obesitas
 * - BMR Mifflin-St Jeor:
 *   - Laki-laki: (10 × BB) + (6.25 × TB) - (5 × usia) + 5
 *   - Perempuan: (10 × BB) + (6.25 × TB) - (5 × usia) - 161
 * - TDEE = BMR × faktor aktivitas:
 *   - Sedentary: 1.2
 *   - Light: 1.375
 *   - Moderate: 1.55
 *   - Active: 1.725
 * - Kisaran berat berdasarkan BMI = 18.5 × tinggi(m)² sampai 24.9 × tinggi(m)²
 * - Protein = BB × 1.4 g/hari
 * - Lemak = (TDEE × 30%) / 9
 * - Karbohidrat = (TDEE - (protein × 4) - (lemak × 9)) / 4 (dihitung dari sisa kalori)
 *
 * Nilai internal menggunakan full precision (presisi penuh).
 * Pembulatan hanya dilakukan saat ditampilkan di UI.
 */

export type StatusBMI = "Kurus" | "Normal" | "Berlebih" | "Obesitas";

export type InputKesehatan = {
  tinggi: number; // dalam cm
  berat: number; // dalam kg
  gender: "pria" | "wanita" | string;
  usia: number; // dalam tahun
  aktivitas:
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "rebahan"
    | "ringan"
    | "sedang"
    | "berat"
    | string;
};

export type HasilKesehatan = {
  bmi: number;
  status: StatusBMI;
  bmr: number;
  tdee: number;
  berat_min: number;
  berat_max: number;
  protein: number;
  lemak: number;
  karbohidrat: number;
};

export const FAKTOR_AKTIVITAS: Record<string, number> = {
  sedentary: 1.2,
  rebahan: 1.2,
  light: 1.375,
  ringan: 1.375,
  moderate: 1.55,
  sedang: 1.55,
  active: 1.725,
  berat: 1.725,
};

export function getFaktorAktivitas(aktivitas: string): number {
  const key = aktivitas.toLowerCase().trim().replace(/[\s-]+/g, "_");
  return FAKTOR_AKTIVITAS[key] ?? 1.55;
}

export function hitungAnalisisKesehatan({
  tinggi,
  berat,
  gender,
  usia,
  aktivitas,
}: InputKesehatan): HasilKesehatan {
  // Tinggi dalam meter (full precision)
  const tinggiM = tinggi / 100;
  const tinggiM2 = tinggiM * tinggiM;

  // 1. BMI = berat / tinggi(m)²
  const bmi = berat / tinggiM2;

  // 2. Status BMI (menggunakan perbandingan floating-point yang aman dari artifact IEEE-754)
  const bmiCheck = Math.round(bmi * 1e6) / 1e6;
  let status: StatusBMI;
  if (bmiCheck < 18.5) {
    status = "Kurus";
  } else if (bmiCheck < 25) {
    status = "Normal";
  } else if (bmiCheck < 30) {
    status = "Berlebih";
  } else {
    status = "Obesitas";
  }

  // 3. BMR Mifflin-St Jeor (full precision)
  const isFemale =
    gender.toLowerCase() === "wanita" || gender.toLowerCase() === "perempuan";
  const bmr = isFemale
    ? 10 * berat + 6.25 * tinggi - 5 * usia - 161
    : 10 * berat + 6.25 * tinggi - 5 * usia + 5;

  // 4. TDEE = BMR × faktor aktivitas (full precision)
  const faktor = getFaktorAktivitas(aktivitas);
  const tdee = bmr * faktor;

  // 5. Kisaran berat berdasarkan BMI: 18.5 × tinggi(m)² sampai 24.9 × tinggi(m)²
  const berat_min = 18.5 * tinggiM2;
  const berat_max = 24.9 * tinggiM2;

  // 6. Protein = BB × 1.4 g/hari
  const protein = berat * 1.4;

  // 7. Lemak = (TDEE × 30%) / 9
  const lemak = (tdee * 0.3) / 9;

  // 8. Karbohidrat = (TDEE - (protein × 4) - (lemak × 9)) / 4
  const karbohidrat = (tdee - protein * 4 - lemak * 9) / 4;

  return {
    bmi,
    status,
    bmr,
    tdee,
    berat_min,
    berat_max,
    protein,
    lemak,
    karbohidrat,
  };
}

/**
 * Format untuk visualisasi UI sesuai spesifikasi tampilan:
 * BMI: ≈ 22.2
 * Status: Normal
 * BMR: ≈ 1624 kcal/hari
 * Kebutuhan energi harian: ≈ 2517 kcal/hari
 * Kisaran berat berdasarkan BMI: ≈ 54.1 – 72.8 kg
 * Protein: ≈ 91 g/hari
 * Lemak: ≈ 84 g/hari
 * Karbohidrat: ≈ 349 g/hari (dihitung dari sisa kalori)
 */
export function formatKesehatanUI(hasil: HasilKesehatan) {
  return {
    bmi: hasil.bmi.toFixed(1),
    status: hasil.status,
    bmr: Math.round(hasil.bmr),
    tdee: Math.round(hasil.tdee),
    kisaran_berat: `${hasil.berat_min.toFixed(1)} – ${hasil.berat_max.toFixed(1)} kg`,
    berat_min: hasil.berat_min.toFixed(1),
    berat_max: hasil.berat_max.toFixed(1),
    protein: Math.round(hasil.protein),
    lemak: Math.round(hasil.lemak),
    karbohidrat: Math.round(hasil.karbohidrat),
  };
}
