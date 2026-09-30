export interface LokasiSeedData {
  name: string;
  category: "gym" | "lapangan" | "low_impact";
  address: string;
  latitude: number;
  longitude: number;
}

export function generateLokasiOlahraga(): LokasiSeedData[] {
  return [
    // Underweight (Kurus) -> Fitness Center / Gym
    {
      name: "CPO Fitness Indramayu",
      category: "gym",
      address: "Rambatan Wetan, Kec. Sindang, Kabupaten Indramayu, Jawa Barat 45213",
      latitude: -6.375127,
      longitude: 108.294001,
    },
    {
      name: "Maximus Gym & Fitness Center",
      category: "gym",
      address: "Jl. DI Panjaitan, Karanganyar, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45213",
      latitude: -6.3298,
      longitude: 108.3245,
    },
    // Normal -> Lapangan / Komunitas Olahraga
    {
      name: "GOR Singalodra Indramayu",
      category: "lapangan",
      address: "Sindang, Kec. Sindang, Kabupaten Indramayu, Jawa Barat 45222",
      latitude: -6.3374,
      longitude: 108.3189,
    },
    {
      name: "Sport Center Indramayu (Lapangan & Komunitas)",
      category: "lapangan",
      address: "Jl. Olahraga, Karanganyar, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45213",
      latitude: -6.3265,
      longitude: 108.3291,
    },
    // Overweight / Obesitas -> Fasilitas Low-Impact (Jalur Jogging / Kolam Renang)
    {
      name: "Kolam Renang & Tirta Sport Center Indramayu",
      category: "low_impact",
      address: "Jl. Olahraga No. 12, Karanganyar, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat",
      latitude: -6.3272,
      longitude: 108.3302,
    },
    {
      name: "Jalur Jogging Taman Cimanuk & Alun-Alun Indramayu",
      category: "low_impact",
      address: "Jl. Mayjen Sutoyo, Margadadi, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat",
      latitude: -6.3248,
      longitude: 108.3214,
    },
  ];
}
