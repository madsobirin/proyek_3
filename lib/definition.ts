import { z } from "zod";

// Auth Definisi nih
export const SignupFormSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }).trim(),
  email: z.string().email({ message: "Email tidak valid." }).trim(),

  password: z
    .string()
    .min(8, { message: "Password minimal 8 karakter." })
    .regex(/[a-zA-Z]/, { message: "Harus mengandung huruf." })
    .regex(/[0-9]/, { message: "Harus mengandung angka." })
    .trim(),
});

export const LoginFormSchema = z.object({
  email: z.string().email({ message: "Email tidak valid." }),
  password: z.string().min(1, { message: "Password harus diisi." }),
});

// Menu Definisi nih
export const MenuSchema = z.object({
  nama_menu: z
    .string()
    .min(3, "Nama menu minimal 3 karakter")
    .max(200, "Nama menu maksimal 200 karakter")
    .trim(),
  deskripsi: z
    .string()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(5000, "Deskripsi maksimal 5000 karakter")
    .trim(),
  kalori: z.number().int().positive().max(10000, "Kalori maksimal 10000"),
  target_status: z.enum(["Kurus", "Normal", "Berlebih", "Obesitas"]),
  waktu_memasak: z
    .number()
    .int()
    .positive()
    .max(1440, "Waktu memasak maksimal 1440 menit"),
  biaya_per_porsi: z
    .number()
    .int()
    .positive("Estimasi biaya harus lebih dari 0")
    .max(100_000_000, "Estimasi biaya maksimal Rp100.000.000"),
  gambar: z
    .string()
    .url("Format gambar harus URL")
    .max(2048, "URL gambar terlalu panjang"),
});

// artikel definis nih
export const ArtikelSchema = z.object({
  judul: z
    .string()
    .min(5, "Judul minimal 5 karakter")
    .max(300, "Judul maksimal 300 karakter")
    .trim(),
  kategori: z
    .string()
    .min(3, "Kategori harus diisi")
    .max(100, "Kategori maksimal 100 karakter")
    .trim(),
  penulis: z
    .string()
    .max(100, "Nama penulis maksimal 100 karakter")
    .trim()
    .optional()
    .default("Admin"),
  isi: z
    .string()
    .min(20, "Isi artikel terlalu pendek")
    .max(50000, "Isi artikel maksimal 50000 karakter"),
  gambar: z
    .string()
    .url("Gambar harus berupa URL valid")
    .max(2048, "URL gambar terlalu panjang"),
  is_featured: z.boolean().optional().default(false),
});
