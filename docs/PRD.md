# Product Requirement Document (PRD) — FitLife

> **Status:** Active / Source of Truth  
> **Last Updated:** 2026-09-27  
> **Repository:** `proyek_3` (FitLife Web & Mobile REST API Service)  
> **Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma ORM, PostgreSQL

---

## 1. Product Overview

**FitLife** (`FitLife.id`) adalah platform kesehatan, kebugaran, dan manajemen nutrisi berbasis web interaktif sekaligus backend REST API untuk integrasi aplikasi mobile (Flutter). Platform ini dirancang untuk membantu pengguna menghitung metrik kesehatan tubuh secara presisi (BMI, BMR, TDEE, estimasi makronutrisi harian), menemukan menu makanan sehat yang disesuaikan dengan status gizi, membaca artikel edukasi kesehatan, mengeksplorasi lokasi fasilitas olahraga/taman terdekat pada peta interaktif, memantau riwayat pemindaian barcode makanan kemasan terintegrasi Open Food Facts, serta berkonsultasi seputar pola hidup sehat melalui asisten AI terintegrasi (**FitBot**).

---

## 2. Product Goals

1. **Akurasi & Personalisasi Metrik Kesehatan:** Menyediakan kalkulator kesehatan komprehensif menggunakan standar Mifflin-St Jeor dan rekomendasi makronutrisi, serta menyimpan riwayat fluktuasi berat badan pengguna ke database.
2. **Panduan Nutrisi & Rekomendasi Menu:** Menyajikan katalog resep makanan sehat yang dapat difilter berdasarkan status gizi (*Kurus, Normal, Berlebih, Obesitas*) lengkap dengan informasi kalori dan durasi memasak.
3. **Pencatatan Nutrisi Makanan Kemasan:** Mendukung ekosistem barcode scanner Open Food Facts untuk mengecek kalori, protein, lemak, karbohidrat, dan gula dari produk makanan serta menyimpan riwayatnya.
4. **Eksplorasi Fasilitas Olahraga:** Membantu pengguna menemukan lokasi gym, lapangan, dan ruang publik olahraga menggunakan peta interaktif berbasis koordinat geografis.
5. **Edukasi & Asistensi Interaktif:** Mendistribusikan artikel kesehatan terkurasi dan menyediakan chatbot cerdas (*FitBot*) yang terpersonalisasi dengan profil fisik pengguna.
6. **Manajemen Konten Terpusat (Admin):** Menyediakan portal administrator untuk mengelola artikel, menu makanan, direktori lokasi olahraga, serta status akun pengguna.

---

## 3. Existing Features

Fitur-fitur yang ada diimplementasikan dengan klasifikasi verifikasi berikut:

| Fitur | Status Verifikasi | Deskripsi Singkat |
| :--- | :--- | :--- |
| **Autentikasi & Otorisasi Pengguna** | **Confirmed from code** | Registrasi & Login (Email/Password & Google OAuth), JWT cookie & Bearer token, auto session sync. |
| **Manajemen Profil Pengguna** | **Confirmed from code** | Edit nama, username, kontak, tanggal lahir, foto profil (Cloudinary face-crop), dan ganti kata sandi. |
| **Kalkulator BMI, BMR, TDEE & Makronutrisi** | **Confirmed from code** | Perhitungan formula Mifflin-St Jeor, rentang berat ideal, distribusi protein, lemak, karbohidrat. |
| **Riwayat & Grafik Tren BMI** | **Confirmed from code** | Visualisasi SVG line chart riwayat berat/BMI, badge tren kenaikan/penurunan, dan penghapusan riwayat. |
| **Katalog Menu Makanan Sehat** | **Confirmed from code** | Filter status target gizi, pencarian teks, detail resep & kalori, penghitung jumlah pembaca (*reader counter*). |
| **Direktori Artikel Edukasi Kesehatan** | **Confirmed from code** | Highlight artikel unggulan (*featured*), filter kategori, pagination, estimasi durasi baca, increment views. |
| **Peta Lokasi Olahraga (Leaflet)** | **Confirmed from code** | Peta interaktif Leaflet.js, geolokasi pengguna, pencarian lokasi, switch tampilan peta vs daftar. |
| **Riwayat & Integrasi Scan Barcode Makanan** | **Confirmed from code** | Endpoint lookup Open Food Facts, penyimpanan riwayat ke cloud, tampilan riwayat gizi di web, dan panduan scan mobile. |
| **FitBot — AI Health Assistant** | **Confirmed from code** | Chatbot kesehatan interaktif via Groq API (`qwen/qwen3.8-27b`), injeksi data profil fisik pengguna, guardrail anti-prompt injection. |
| **Dashboard Metrik Admin** | **Confirmed from code** | Statistik ringkasan total pengguna, pengguna aktif, total menu, total artikel, serta menu terpopuler & pengguna terbaru. |
| **CRUD Manajemen Konten Admin** | **Confirmed from code** | Modul kelola Pengguna (toggle status aktif/hapus), Menu Sehat, Artikel (Rich Text TipTap), dan Lokasi Olahraga. |
| **Integrasi Mobile App REST API** | **Confirmed from code** | Endpoint auth, profile, menu, artikel, scan-makanan, dan kalkulator mendukung mobile clients via `Authorization: Bearer`. |

---

## 4. Target Users

*(Berdasarkan inferensi dari alur kerja, domain fungsional, dan data model)*

1. **Individu dengan Target Pengelolaan Berat Badan:** Pengguna yang ingin menurunkan, menaikkan, atau mempertahankan berat badan dengan panduan kalori harian dan pemantauan grafik berkala. *(Inferred)*
2. **Pecinta Makanan Sehat & Pelaku Diet:** Orang yang membutuhkan inspirasi menu makanan sehat dengan batasan kalori terukur dan petunjuk memasak yang jelas. *(Inferred)*
3. **Konsumen Sadar Nutrisi:** Pengguna belanja harian yang ingin memverifikasi kandungan gizi (gula, lemak, protein, kalori) produk kemasan melalui scan barcode. *(Inferred)*
4. **Komunitas Olahraga / Fitness Enthusiast:** Pengguna yang mencari rekomendasi tempat olahraga umum, gym, atau taman di sekitar area mereka. *(Inferred)*
5. **Administrator & Content Creator FitLife:** Pengelola konten yang bertanggung jawab memperbarui artikel, resep menu, fasilitas olahraga, dan memantau status pengguna. *(Confirmed from code)*

---

## 5. Main User Flows

### 5.1 Alur Perhitungan Metrik Kesehatan & Sinkronisasi Profil
```mermaid
flowchart TD
    Start([Kunjungi /kalkulator]) --> Input[Input TB, BB, Gender, Usia, Aktivitas]
    Input --> Calc[Hitung BMI, BMR, TDEE & Makro via lib/kesehatan.ts]
    Calc --> Display[Tampilkan Hasil & Rekomendasi Menu Relevan]
    Display --> CheckAuth{Apakah User Login?}
    CheckAuth -->|Ya| SaveDB[POST /api/perhitungan]
    SaveDB --> Transact[Prisma Transaction:\n1. Simpan snapshot ke Perhitungan\n2. Sync BB & TB terkini ke Account]
    Transact --> UpdateChart[Update Grafik Riwayat BMI di Halaman]
    CheckAuth -->|Tidak| GuestNote[Tampilkan Hasil Tanpa Menyimpan Riwayat]
    UpdateChart --> End([Selesai])
    GuestNote --> End
```

### 5.2 Alur FitBot — Asisten Kesehatan Interaktif
```mermaid
flowchart TD
    ChatOpen[Klik Floating ChatButton] --> CheckLogin{User Login?}
    CheckLogin -->|Tidak| ShowPrompt[Tampilkan Pesan Harus Login]
    CheckLogin -->|Ya| OpenPanel[Buka ChatPanel]
    OpenPanel --> UserMsg[Kirim Pertanyaan / Pilih Quick Prompt]
    UserMsg --> ApiReq[POST /api/chat]
    ApiReq --> FetchContext[Ambil Profil User & 5 Riwayat BMI Terakhir]
    FetchContext --> GroqCall[Call Groq Cloud API: qwen/qwen3.8-27b]
    GroqCall --> GuardCheck{Lolos Guardrail Kesehatan?}
    GuardCheck -->|Ya| HealthAnswer[Berikan Saran Nutrisi / Kalori Personal]
    GuardCheck -->|Di Luar Topik/Coding| Refusal[Penolakan Ramah: Hanya Melayani Topik Kesehatan]
    HealthAnswer --> RenderMarkdown[Render Jawaban via ReactMarkdown]
    Refusal --> RenderMarkdown
```

### 5.3 Alur Barcode Scanner & Riwayat Gizi
```mermaid
flowchart TD
    MobileScan[Scan Barcode via Kamera Mobile] --> LookupAPI[POST /api/scan-makanan/lookup]
    LookupAPI --> OFF[Query Open Food Facts REST API]
    OFF --> ParseNutri[Ekstraksi Nilai Gizi per 100g]
    ParseNutri --> ModalResult[Tampilkan Detail Gizi Produk]
    ModalResult --> UserSave{Klik Simpan ke Riwayat?}
    UserSave -->|Ya & Auth| SaveAPI[POST /api/scan-makanan/save]
    SaveAPI --> DBRecord[(Simpan ke tabel scan_makanan)]
    UserSave -->|Selesai/Tutup| ExitScan[Selesai]
    DBRecord --> WebHistory[Tampil di Web: /scan-makanan]
    WebHistory --> DeleteItem[User dapat menghapus item riwayat]
```

---

## 6. Page & Route Inventory

### 6.1 Client & Public Pages (`app/(client)` & `app/(auth)`)
| URL Path | Akses | Komponen Utama | Keterangan | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Publik | `Home`, `HomeRecentContent`, `ChatButton` | Landing page, pengantar platform, cuplikan menu & artikel terbaru. | Confirmed |
| `/login` | Tamu / Publik | `LoginClient`, `GoogleAuthButton` | Formulir login email/password & Google OAuth. | Confirmed |
| `/register` | Tamu / Publik | `RegisterPage`, `GoogleAuthButton` | Formulir pendaftaran akun pengguna baru. | Confirmed |
| `/kalkulator` | Publik / User | `KalkulatorBMIPage`, `BMIRiwayatChart` | Kalkulator interaktif, grafik SVG tren BMI, rekomendasi menu terkait. | Confirmed |
| `/menu` | Publik | `MenuPage`, `MenuFilter`, `Pagination` | Direktori resep menu sehat, filter target status gizi, pencarian judul. | Confirmed |
| `/menu/[slug]` | Publik | `MenuDetailPage`, `RecipeInfo` | Detail menu lengkap, kalori, waktu memasak, reader counter. | Confirmed |
| `/artikel` | Publik | `ArtikelPage`, `FeaturedBanner`, `CategoryPills` | Direktori artikel kesehatan, highlight artikel unggulan, durasi baca. | Confirmed |
| `/artikel/[slug]` | Publik | `ArtikelDetailPage`, `TiptapRenderer` | Detail artikel lengkap, counter pembaca, konten HTML/rich text. | Confirmed |
| `/lokasi` | Publik | `LokasiOlahragaPage`, `MapView` (Leaflet) | Peta pencari tempat olahraga & gym, switch mode peta vs list. | Confirmed |
| `/scan-makanan` | Publik / User | `ScanMakananPage`, `AuthenticatedHistory` | Riwayat pemindaian barcode gizi akun login & promosi aplikasi mobile. | Confirmed |
| `/profile` | Auth User | `ProfilePage`, `AvatarUpload`, `PasswordChange` | Pengaturan profil pribadi, foto via Cloudinary, ganti password akun. | Confirmed |

### 6.2 Admin Pages (`app/(admin)`)
| URL Path | Akses | Komponen Utama | Keterangan | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/admin/dashboard` | Role Admin | `DashboardPage`, `StatCard`, `RecentList` | Ringkasan statistik pengguna, menu, artikel, dan aktivitas terkini. | Confirmed |
| `/admin/pengguna` | Role Admin | `PenggunaPage`, `UserTable`, `ToggleActive` | Kelola akun, aktifkan/nonaktifkan status akun, hapus akun pengguna. | Confirmed |
| `/admin/menu` | Role Admin | `MenuPage`, `MenuTable`, `DeleteModal` | Daftar tabel manajemen menu makanan sehat. | Confirmed |
| `/admin/menu/create` | Role Admin | `CreateMenuPage`, `ImageUpload` | Formulir penambahan menu sehat baru + upload foto ke Cloudinary. | Confirmed |
| `/admin/menu/[slug]/edit`| Role Admin | `EditMenuPage`, `ImageUpload` | Edit rincian menu sehat, target status, kalori, waktu memasak. | Confirmed |
| `/admin/artikel` | Role Admin | `ArtikelPage`, `ArtikelTable` | Daftar artikel kesehatan yang tersimpan di sistem. | Confirmed |
| `/admin/artikel/create` | Role Admin | `CreateArtikelPage`, `RichTextEditor` | Pembuatan artikel baru dengan editor TipTap (WYSIWYG). | Confirmed |
| `/admin/artikel/[slug]/edit`| Role Admin| `EditArtikelPage`, `RichTextEditor` | Perubahan judul, konten isi artikel, kategori, dan status featured. | Confirmed |
| `/admin/lokasi` | Role Admin | `LokasiAdminPage`, `LokasiTable` | Daftar fasilitas olahraga yang tercatat dalam sistem. | Confirmed |
| `/admin/lokasi/create` | Role Admin | `CreateLokasiPage`, `LokasiPickerMap` | Tambah lokasi olahraga dengan pin koordinat peta (reverse geocoding). | Confirmed |
| `/admin/lokasi/[id]/edit` | Role Admin | `EditLokasiPage`, `LokasiPickerMap` | Edit nama tempat, alamat, dan pin koordinat tempat olahraga. | Confirmed |
| `/admin/profile` | Role Admin | `AdminProfilePage` | Pengaturan data profil administrator. | Confirmed |

---

## 7. Navigation Structure

```mermaid
graph TD
    Root[FitLife.id] --> Header[Navbar Klien]
    Header --> NavHome["Home (/)"]
    Header --> NavKalkulator["Kalkulator BMI (/kalkulator)"]
    Header --> NavMenu["Menu Sehat (/menu)"]
    Header --> NavArtikel["Artikel (/artikel)"]
    Header --> NavLokasi["Lokasi (/lokasi)"]
    Header --> NavScan["Riwayat Scan (/scan-makanan)"]
    Header --> ThemeSwitch["Theme Toggle (Light/Dark)"]
    Header --> NavAuth{"Sesi User?"}
    
    NavAuth -->|Belum Login| NavLogin["Login (/login)"]
    NavAuth -->|User Biasa| UserMenu["Dropdown: Profil (/profile), Logout"]
    NavAuth -->|Role Admin| AdminMenu["Dropdown: Profil, Dashboard Admin, Logout"]
    
    Root --> AdminSidebar[Admin Portal (/admin/*)]
    AdminSidebar --> ADash["Dashboard (/admin/dashboard)"]
    AdminSidebar --> AUser["Kelola Pengguna (/admin/pengguna)"]
    AdminSidebar --> AMenu["Kelola Menu (/admin/menu)"]
    AdminSidebar --> AArt["Kelola Artikel (/admin/artikel)"]
    AdminSidebar --> ALok["Kelola Lokasi (/admin/lokasi)"]
    AdminSidebar --> AProf["Profil Admin (/admin/profile)"]

    Root --> FloatingBot["Floating FitBot Launcher (ChatButton)"]
```

---

## 8. Feature Details

### 8.1 Modul Analisis Kesehatan & Nutrisi (`lib/kesehatan.ts`)
- **Formula BMI:** `BMI = BB / (TB/100)²`
- **Kategori BMI:**
  - `< 18.5`: Kurus (*Underweight*)
  - `18.5 – < 25.0`: Normal (*Healthy Weight*)
  - `25.0 – < 30.0`: Berlebih (*Overweight*)
  - `≥ 30.0`: Obesitas (*Obese*)
- **Formula BMR (Mifflin-St Jeor):**
  - Pria: `(10 × BB) + (6.25 × TB) - (5 × usia) + 5`
  - Wanita: `(10 × BB) + (6.25 × TB) - (5 × usia) - 161`
- **Faktor Pengali Aktivitas (TDEE):**
  - *Sedentary / Rebahan:* `1.2`
  - *Light / Ringan:* `1.375`
  - *Moderate / Sedang:* `1.55`
  - *Active / Berat:* `1.725`
- **Distribusi Makronutrisi:**
  - Protein: `BB × 1.4 g/hari`
  - Lemak: `(TDEE × 30%) / 9 g/hari`
  - Karbohidrat: `(TDEE - (Protein × 4) - (Lemak × 9)) / 4 g/hari` (sisa alokasi kalori)
- **Rentang Berat Normal:** `18.5 × (TB_m)²` sampai `24.9 × (TB_m)²`

### 8.2 FitBot AI Assistant (`app/api/chat/route.ts` & `components/ChatPanel.tsx`)
- **Penyedia AI:** Groq Cloud API dengan model `qwen/qwen3.8-27b`.
- **Ketahanan Jaringan:** Mekanisme *exponential backoff retry* (3 percobaan) khusus untuk kode status 429 (*rate limit*) dan 503 (*overloaded*).
- **Injeksi Konteks Dinamis:** Mengekstrak nama, berat, tinggi, tanggal lahir, dan 5 riwayat BMI terakhir pengguna dari database untuk dimasukkan ke system prompt.
- **Guardrail Keamanan:** Larangan menjawab topik di luar kesehatan/olahraga dan penolakan keras untuk menghasilkan kode pemrograman (*anti-prompt injection*).
- **Clear Chat / Reset History:** Tombol "Hapus Chat / Obrolan Baru" di header panel obrolan untuk membersihkan percakapan di layar sekaligus me-reset riwayat memory konteks (sehingga input token percakapan kembali ke 0).

### 8.3 Barcode Scanner & Integrasi Open Food Facts
- **Validasi Barcode:** Hanya menerima angka 3 hingga 64 digit (`^\d{3,64}$`).
- **Endpoint Lookup:** `POST /api/scan-makanan/lookup` melakukan fetch ke `https://world.openfoodfacts.org/api/v0/product/{barcode}.json` tanpa menyimpan ke database.
- **Normalisasi Nilai Gizi:** Mengambil nutrisi per 100g (kalori, protein, lemak, karbohidrat, gula).
- **Penyimpanan Selektif:** Pengguna login dapat memilih untuk menyimpan hasil scan ke tabel `scan_makanan` melalui `POST /api/scan-makanan/save`.

### 8.4 Peta Lokasi Olahraga (Leaflet)
- **Komponen Client-side:** Dimuat secara dinamis (`ssr: false`) untuk mencegah error rendering server Leaflet window object.
- **Fitur Interaksi:** Auto-detect posisi browser (`navigator.geolocation`), filter pencarian dengan debounce 400ms, serta switch mode peta vs daftar.
- **Admin Geocoding:** Admin dapat memilih titik koordinat pada peta (`LokasiPickerMap`) yang otomatis mengisi form alamat via reverse geocoding OpenStreetMap Nominatim.

---

## 9. Existing UI & Design System

- **Styling Core:** Tailwind CSS v4 dikombinasikan dengan token semantic shadcn UI (`app/globals.css`).
- **Palet Warna Utama:**
  - `Primary:` Hijau Neon/Spring Green (`#00ff7f`), Hover: `#00cc66`
  - `Accent Surface:` `#265140`
  - `Dark Mode Base:` Latar belakang `#05130b`, Kartu `#0a2215`, Border `#15432a`, Teks `#e6fcf0`
  - `Light Mode Base:` Latar belakang `#f0fdf4`, Kartu `#ffffff`, Teks `#052e16`
- **Tipografi:** Google Font *Inter* (`var(--font-inter)`) yang diterapkan di seluruh aplikasi.
- **Komponen UI:** Radix UI primitives (`dialog`, `dropdown-menu`, `slot`), Lucide React icons, Sonner (notifikasi toast).
- **Animasi & Interaktivitas:** `framer-motion`, `gsap`, dan utilitas animasi Tailwind.
- **Editor Konten:** TipTap Starter Kit dengan ekstensi styling warna, tautan, perataan teks, gambar, dan blok kode dengan lowlight syntax highlighting.

---

## 10. Database Entities & Relationships

```mermaid
erDiagram
    Account ||--o{ Perhitungan : "has"
    Account ||--o{ LokasiOlahraga : "creates"
    Account ||--o{ ScanMakanan : "saves"

    Account {
        Int id PK
        String name
        String username UK
        String email UK
        String google_id
        String role "default: user"
        String password
        Boolean is_active "default: true"
        DateTime last_login_at
        String phone
        DateTime birthdate
        Int weight
        Int height
        String photo
        String google_avatar
        DateTime created_at
        DateTime updated_at
    }

    Perhitungan {
        Int id PK
        Int user_id FK
        Float tinggi_badan
        Float berat_badan
        Float bmi
        String status
        String gender
        Int usia
        String aktivitas
        Float bmr
        Float tdee
        Float target_kalori
        Float berat_min
        Float berat_max
        Float protein
        Float karbohidrat
        Float lemak
        DateTime created_at
        DateTime updated_at
    }

    ScanMakanan {
        Int id PK
        Int user_id FK
        String barcode
        String nama_makanan
        String brand
        String image_url
        Float kalori
        Float protein
        Float lemak
        Float karbohidrat
        Float gula
        DateTime created_at
    }

    LokasiOlahraga {
        Int id PK
        Int user_id FK
        String name
        String address
        Float latitude
        Float longitude
        DateTime created_at
        DateTime updated_at
    }

    Menu {
        Int id PK
        String nama_menu
        String slug UK
        String deskripsi
        Int kalori
        TargetStatus target_status "Enum: Kurus|Normal|Berlebih|Obesitas"
        Int waktu_memasak
        Int dibaca
        String gambar
        DateTime created_at
        DateTime updated_at
    }

    Artikel {
        Int id PK
        String judul
        String slug UK
        String kategori
        String penulis
        String isi
        String gambar
        Boolean is_featured
        Int dibaca
        DateTime created_at
        DateTime updated_at
    }
```

---

## 11. Prisma Schema & Model Details

Skema database diorganisasi dalam direktori `prisma/models/` dan digenerate ke `@/generated/prisma`:
- **Generator Client:** `provider = "prisma-client"`, `output = "../generated/prisma"`.
- **Database Provider:** PostgreSQL via connection pooling `@prisma/adapter-pg`.
- **Model `Account` (`prisma/models/account.prisma`):**
  - Menyimpan kredensial otentikasi, profil demografi, dan role (`user` vs `admin`).
  - Relasi 1-to-many cascading ke `Perhitungan`, `LokasiOlahraga`, dan `ScanMakanan`.
- **Model `Menu` (`prisma/models/menu.prisma`):**
  - Menggunakan enum PostgreSQL `TargetStatus` (`Kurus`, `Normal`, `Berlebih`, `Obesitas`).
  - Kolom `slug` unik sebagai penanda routing URL SEO-friendly.
- **Model `Artikel` (`prisma/models/artikel.prisma`):**
  - Menyimpan konten HTML/Rich Text berukuran besar dalam kolom bertipe `@db.Text`.
- **Model `Perhitungan` (`prisma/models/perhitungan.prisma`):**
  - Menyimpan nilai hasil perhitungan lengkap agar riwayat historis tidak berubah bila formula diperbarui.
- **Model `ScanMakanan` (`prisma/models/scanMakanan.prisma`):**
  - Menyimpan cache informasi produk Open Food Facts milik pengguna spesifik.
- **Model `LokasiOlahraga` (`prisma/models/lokasiOlahraga.prisma`):**
  - Menyimpan koordinat desimal `latitude` dan `longitude` untuk plotting peta.

---

## 12. API Endpoints & Backend Integrations

### 12.1 Autentikasi (`/api/auth/*`)
- `POST /api/auth/register` — Pendaftaran akun pengguna baru (validasi Zod).
- `POST /api/auth/login` — Login akun email/password, return JSON token & set HTTP-only cookie.
- `POST /api/auth/google` — Login/registrasi instan via Google OAuth ID Token (`google-auth-library`).
- `GET /api/auth/me` — Cek status sesi login pengguna saat ini via cookie/token.
- `POST /api/auth/logout` — Menghapus cookie otentikasi `token`.

### 12.2 Profil Akun (`/api/profile/*` & `/api/accounts/*`)
- `GET /api/profile` — Mengambil data akun pengguna login lengkap.
- `PATCH /api/profile` — Memperbarui profil (nama, username, nomor HP, tanggal lahir, BB, TB).
- `PATCH /api/profile/password` — Ganti password akun (verifikasi password lama, enkripsi bcrypt 12 rounds).
- `POST /api/profile/upload` — Upload avatar ke Cloudinary (`fitlife/avatars`) dengan cropping otomatis wajah.
- `GET /api/accounts` — Daftar akun pengguna (filter opsional `?role=user`).
- `PATCH /api/accounts/[id]` — Toggle status akun pengguna (`is_active: true/false`).
- `DELETE /api/accounts/[id]` — Hapus akun pengguna (cascade delete relasi).

### 12.3 Kalkulator & Kesehatan (`/api/perhitungan`)
- `POST /api/perhitungan` — Menghitung metrik kesehatan tubuh. Jika login, otomatis transaksi database: simpan ke `Perhitungan` & sync BB/TB ke `Account`.
- `GET /api/perhitungan` — Mengambil 10 riwayat perhitungan terbaru pengguna terotentikasi.
- `DELETE /api/perhitungan?id={id}` — Menghapus 1 entri riwayat perhitungan milik user.

### 12.4 Menu Sehat (`/api/menus/*` & `/api/upload/menu`)
- `GET /api/menus` — Mengambil katalog menu makanan (dukungan filter kategori status & search).
- `POST /api/menus` — Admin: membuat menu makanan sehat baru.
- `GET /api/menus/[slug]` — Detail resep menu (otomatis increment kolom `dibaca`).
- `PUT /api/menus/[slug]` — Admin: memperbarui menu sehat.
- `DELETE /api/menus/[slug]` — Admin: menghapus menu sehat.
- `POST /api/upload/menu` — Upload gambar menu ke Cloudinary folder `fitlife/menus` (max 3MB).

### 12.5 Artikel Kesehatan (`/api/artikels/*`)
- `GET /api/artikels` — Mengambil seluruh artikel kesehatan (dukungan search & kategori).
- `POST /api/artikels` — Admin: membuat artikel baru dengan slug otomatis.
- `GET /api/artikels/[slug]` — Detail lengkap isi artikel (otomatis increment kolom `dibaca`).
- `PUT /api/artikels/[slug]` — Admin: update artikel.
- `DELETE /api/artikels/[slug]` — Admin: menghapus artikel.

### 12.6 Scan Barcode Makanan (`/api/scan-makanan/*`)
- `POST /api/scan-makanan/lookup` — Publik: query produk ke Open Food Facts API berdasarkan barcode 3-64 digit.
- `POST /api/scan-makanan/save` — Auth: menyimpan data produk makanan ke riwayat akun.
- `GET /api/scan-makanan` — Auth: mengambil daftar riwayat scan pengguna.
- `DELETE /api/scan-makanan?id={id}` — Auth: menghapus satu entri riwayat scan makanan.

### 12.7 Lokasi Olahraga (`/api/lokasi-olahraga/*`)
- `GET /api/lokasi-olahraga` — Publik: daftar semua lokasi olahraga (dukungan query `?search=`).
- `POST /api/lokasi-olahraga` — Admin: menambah lokasi baru (nama, alamat, latitude, longitude).
- `GET /api/lokasi-olahraga/[id]` — Detail satu lokasi olahraga.
- `PUT /api/lokasi-olahraga/[id]` — Admin: memperbarui detail lokasi olahraga.
- `DELETE /api/lokasi-olahraga/[id]` — Admin: menghapus fasilitas lokasi olahraga.

### 12.8 Asisten AI & Dashboard Admin
- `POST /api/chat` — Auth: konsultasi kesehatan FitBot dengan Groq API + context injection.
- `GET /api/admin/dashboard` — Admin: agregasi metrik statistik platform.

---

## 13. Authentication & Authorization

- **Metode Token:** JSON Web Token (JWT) ditandatangani menggunakan algoritma HS256 dengan `process.env.JWT_SECRET`.
- **Masa Berlaku Token:** 7 hari (`expirationTime: "7d"`).
- **Transport Token:**
  - Web Browser: Disimpan pada cookie secure `token` (`httpOnly: true`, `sameSite: "lax"`, `path: "/"`).
  - Mobile / External Client: Diterima via header HTTP `Authorization: Bearer <token>`.
- **Pemeriksaan Otorisasi (`lib/auth.ts`):** Fungsi `getAuthUser(req)` memprioritaskan header `Authorization: Bearer`, lalu fallback ke HTTP cookie `token`.
- **Middleware Proteksi (`proxy.ts`):**
  - Rute `/admin/*` hanya dapat diakses jika token memiliki klaim `role === "admin"`.
  - Rute `/profile/*` dialihkan ke `/login` jika pengguna belum login.
  - Pengguna dengan role `admin` yang mengakses halaman root `/` dialihkan langsung ke `/admin/dashboard`.
  - Injeksi header CORS (`Access-Control-Allow-Origin: *`) pada seluruh rute `/api/*` untuk mendukung client Flutter mobile.

---

## 14. State Management & Data Flow

- **Server-Side Render vs Client Interaction:**
  - Halaman publik memanfaatkan SSR untuk meta data, kemudian client components (`"use client"`) menangani interaktivitas (kalkulator, filter, scanner, peta).
- **Manajemen State Lokal:** Menggunakan React hooks standar (`useState`, `useEffect`, `useCallback`, `useTransition`, `useRef`).
- **Debounced Fetching:** Pencarian pada katalog menu, artikel, dan lokasi menggunakan debounce timer (400ms) untuk menghemat request jaringan.
- **Theme State:** Dikelola oleh `next-themes` (`ThemeProvider`) dengan persistence ke local storage.
- **Form State & Sanitasi:** Validasi input terpusat menggunakan library `zod` (`lib/definition.ts` dan handler API individual).

---

## 15. Important Business Rules

1. **Konsistensi Metrik Fisik Pengguna:** Saat pengguna terotentikasi melakukan perhitungan pada `/kalkulator`, berat dan tinggi badan pada tabel `Account` otomatis disinkronkan ke nilai terbaru secara transaksional (`prisma.$transaction`), sementara snapshot historis tetap tersimpan utuh di `Perhitungan`.
2. **Kesesuaian Target Gizi Menu:** Setiap menu wajib memiliki klasifikasi `TargetStatus` (`Kurus`, `Normal`, `Berlebih`, `Obesitas`) yang berkorelasi langsung dengan hasil evaluasi status BMI pengguna.
3. **Pembatasan Topik AI (FitBot):** FitBot dilarang keras melayani topik non-kesehatan dan dilarang membuat kode pemrograman apa pun guna menjaga integritas fungsi sebagai asisten kebugaran.
4. **Keamanan Barcode Open Food Facts:** Nilai barcode dibatasi strictly numerik 3 hingga 64 digit guna mencegah ancaman path traversal / injection URL ke API pihak ketiga.
5. **Generasi Slug Unik:** Judul artikel dan nama menu otomatis diubah menjadi slug URL huruf kecil bebas karakter khusus dengan suffix unik jika terdeteksi duplikasi.
6. **Inkrementasi Counter Pembaca:** Mengunjungi detail menu (`/menu/[slug]`) atau detail artikel (`/artikel/[slug]`) mengeksekusi operasi `increment: 1` pada kolom `dibaca`.
7. **Pembersihan Data Berantai (Cascade Delete):** Penghapusan data akun `Account` memicu penghapusan berantai pada semua data `Perhitungan`, `ScanMakanan`, dan `LokasiOlahraga` yang berelasi.

---

## 16. Dependencies & External Services

### 16.1 Layanan Eksternal
- **Open Food Facts API:** Layanan basis data terbuka untuk mengambil komposisi gizi produk makanan berdasarkan barcode (`world.openfoodfacts.org`).
- **Groq Cloud API:** Layanan inferensi model bahasa LLM ultra-cepat untuk chatbot FitBot (`qwen/qwen3.8-27b`).
- **Cloudinary:** Layanan penyimpanan aset gambar berbasis cloud untuk foto profil pengguna dan dokumentasi menu makanan.
- **Google OAuth 2.0:** Layanan autentikasi identitas akun Google via ID Token.
- **OpenStreetMap & Leaflet Tile Server:** Penyedia ubin peta gratis untuk visualisasi lokasi olahraga.

### 16.2 Dependensi Kunci (`package.json`)
- **Framework & Runtime:** `next@16.1.6`, `react@19.2.3`, `react-dom@19.2.3`, `typescript@5`.
- **Database & ORM:** `@prisma/client@7.4.2`, `prisma@7.4.2`, `@prisma/adapter-pg@7.4.2`, `pg@8.19.0`.
- **Keamanan & Autentikasi:** `jose@6.2.1`, `bcryptjs@3.0.3`, `google-auth-library@10.6.1`, `@react-oauth/google@0.13.4`.
- **UI & Styling:** `tailwindcss@4`, `@tailwindcss/typography`, `tw-animate-css`, `radix-ui`, `lucide-react`, `sonner`, `next-themes`.
- **Animasi & Rich Media:** `framer-motion`, `gsap`, `@tiptap/react`, `leaflet`, `react-leaflet`.
- **Validasi Data:** `zod@4.3.6`.

---

## 17. Platform & Environment Requirements

### 17.1 Persyaratan Lingkungan (Environment Variables)
Aplikasi membutuhkan konfigurasi pada berkas `.env`:
- `DATABASE_URL`: URI koneksi PostgreSQL (contoh: `postgresql://user:password@localhost:5432/fitlife`).
- `JWT_SECRET`: Kunci rahasia acak untuk enkripsi dan verifikasi JWT token.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Client ID Google OAuth dari Google Cloud Console.
- `GROQ_API_KEY`: API Key Groq untuk layanan asisten AI FitBot.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Kredensial upload Cloudinary.
- `NEXT_PUBLIC_FITLIFE_MOBILE_APP_URL` / `NEXT_PUBLIC_FITLIFE_ANDROID_URL`: URL tautan aplikasi mobile.

### 17.2 Persyaratan Eksekusi
- **Node.js:** Versi `>= 20.x`.
- **Database:** PostgreSQL versi `>= 14.x`.
- **Browser Compatibility:** Browser modern dengan dukungan ES2022, Geolocation API, dan HTML5 Canvas/SVG.

---

## 18. Current Limitations & Known Issues

1. **Leaflet SSR Incompatibility:** Library peta Leaflet tidak dapat dirender di sisi server (Node.js) sehingga seluruh komponen peta wajib dimuat secara asinkronus menggunakan `next/dynamic` dengan opsi `{ ssr: false }`.
2. **Ketergantungan Ketersediaan Data Barcode:** Akurasi pencarian produk makanan kemasan bergantung penuh pada ketersediaan data di repositori publik Open Food Facts. Produk lokal tertentu mungkin belum terdaftar.
3. **Penyimpanan Gambar Artikel:** Konten artikel saat ini mendukung rich text TipTap, tetapi upload gambar inline artikel masih memerlukan integrasi aset eksternal atau URL publik.
4. **Token Refresh:** Sistem saat ini menggunakan single JWT 7 hari tanpa refresh token rotation berjangka pendek.

---

## 19. Important Technical Constraints

1. **Dual Schema Architecture:** Model Prisma dipisah menjadi modul-modul individual di `prisma/models/*.prisma` dan dikonsolidasikan saat proses generator client berjalan.
2. **Konfigurasi Domain Gambar Eksternal:** Seluruh sumber gambar eksternal wajib didaftarkan di `next.config.ts` (`images.remotePatterns`): `lh3.googleusercontent.com`, `images.unsplash.com`, `res.cloudinary.com`, `images.openfoodfacts.org`, dan `static.openfoodfacts.org`.
3. **CORS untuk Klien Mobile:** Next.js middleware / proxy menangani request `OPTIONS` dan memasang header CORS pada semua rute `/api/*` untuk memastikan kelancaran komunikasi dari aplikasi Flutter di Android/iOS.

---

## 20. Feature to Page / Component Mapping

| Fitur | Halaman Utama | Komponen UI | API Handler Terkait | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Login & Registrasi** | `/login`, `/register` | `LoginClient`, `RegisterPage`, `GoogleAuthButton` | `/api/auth/login`, `/api/auth/register`, `/api/auth/google` | Confirmed |
| **Kalkulator BMI & Makro** | `/kalkulator` | `KalkulatorBMIPage`, `BMIRiwayatChart` | `/api/perhitungan` | Confirmed |
| **Katalog Menu Sehat** | `/menu`, `/menu/[slug]` | `MenuPage`, `MenuDetailPage`, `MenuFilter` | `/api/menus`, `/api/menus/[slug]` | Confirmed |
| **Artikel Edukasi** | `/artikel`, `/artikel/[slug]` | `ArtikelPage`, `ArtikelDetailPage` | `/api/artikels`, `/api/artikels/[slug]` | Confirmed |
| **Peta Lokasi Olahraga** | `/lokasi` | `LokasiOlahragaPage`, `MapView`, `LokasiMap` | `/api/lokasi-olahraga` | Confirmed |
| **Riwayat Scan Barcode** | `/scan-makanan` | `ScanMakananPage`, `AuthenticatedHistory` | `/api/scan-makanan`, `/api/scan-makanan/save` | Confirmed |
| **FitBot AI Chat** | Global Floating Widget | `ChatButton`, `ChatPanel` | `/api/chat` | Confirmed |
| **Profil Pengguna** | `/profile` | `ProfilePage`, `NavProfile` | `/api/profile`, `/api/profile/upload`, `/api/profile/password` | Confirmed |
| **Admin Dashboard** | `/admin/dashboard` | `DashboardPage`, `StatCard` | `/api/admin/dashboard` | Confirmed |
| **Admin Kelola Pengguna** | `/admin/pengguna` | `PenggunaPage` | `/api/accounts`, `/api/accounts/[id]` | Confirmed |
| **Admin Kelola Menu** | `/admin/menu/*` | `MenuPage`, `CreateMenuPage`, `EditMenuPage` | `/api/menus`, `/api/upload/menu` | Confirmed |
| **Admin Kelola Artikel** | `/admin/artikel/*`| `ArtikelPage`, `CreateArtikelPage`, `RichTextEditor` | `/api/artikels` | Confirmed |
| **Admin Kelola Lokasi** | `/admin/lokasi/*` | `LokasiAdminPage`, `CreateLokasiPage`, `LokasiPickerMap` | `/api/lokasi-olahraga`, `/api/lokasi-olahraga/[id]` | Confirmed |

---

## 21. Acceptance Criteria for Major Existing Features

### 21.1 Kalkulator BMI & Analisis Kesehatan
- **GIVEN** pengguna memasukkan tinggi badan (cm), berat badan (kg), jenis kelamin, usia, dan tingkat aktivitas:
- **WHEN** pengguna menekan tombol hitung:
- **THEN** sistem menghitung nilai BMI, status gizi (*Kurus/Normal/Berlebih/Obesitas*), BMR, TDEE, rentang berat ideal, serta gram protein, lemak, dan karbohidrat.
- **AND** jika pengguna dalam keadaan login, data tersebut otomatis tersimpan di tabel `perhitungan` dan berat/tinggi badan pada profil pengguna di tabel `accounts` diperbarui.
- **AND** grafik tren riwayat BMI menampilkan titik data baru secara berurutan.

### 21.2 FitBot AI Assistant
- **GIVEN** pengguna yang terotentikasi membuka widget chat FitBot:
- **WHEN** pengguna mengirim pertanyaan seputar kesehatan, kalori, atau diet:
- **THEN** FitBot merespons dalam format Markdown menggunakan persona asisten kesehatan FitLife dengan mempertimbangkan data profil fisik pengguna.
- **WHEN** pengguna meminta FitBot menulis kode pemrograman atau bertanya topik non-kesehatan:
- **THEN** FitBot menolak permintaan tersebut secara ramah dan mengarahkan kembali ke topik gaya hidup sehat.
- **WHEN** pengguna belum login:
- **THEN** widget menampilkan antarmuka yang mengarahkan pengguna untuk login terlebih dahulu.

### 21.3 Pemindaian & Pencarian Barcode Produk Makanan
- **GIVEN** client mengirim nomor barcode produk yang valid (3–64 digit numerik):
- **WHEN** request dikirim ke `POST /api/scan-makanan/lookup`:
- **THEN** sistem menghubungi Open Food Facts dan mengembalikan nama produk, merk, gambar, kalori, protein, lemak, karbohidrat, dan gula per 100g.
- **AND** jika produk tidak ditemukan, sistem mengembalikan status HTTP 404 dengan pesan deskriptif.
- **WHEN** pengguna terotentikasi memilih untuk menyimpan hasil scan:
- **THEN** request `POST /api/scan-makanan/save` menyimpan rekaman ke tabel `scan_makanan` dan entri langsung dapat dilihat di `/scan-makanan`.

### 21.4 Direktori Menu Sehat & Filter Status
- **GIVEN** pengunjung membuka halaman `/menu`:
- **WHEN** memilih salah satu filter status gizi (misal: *Berlebih*):
- **THEN** daftar menu terfilter hanya menampilkan hidangan dengan `target_status` bernilai *Berlebih*.
- **WHEN** pengunjung mengklik kartu menu untuk melihat detail:
- **THEN** halaman `/menu/[slug]` menampilkan rincian kalori, waktu memasak, dan deskripsi resep, serta counter `dibaca` bertambah 1.

### 21.5 Peta Lokasi Olahraga Interaktif
- **GIVEN** pengguna mengakses halaman `/lokasi`:
- **WHEN** browser mengizinkan akses geolokasi:
- **THEN** posisi pengguna ditandai pada peta dan lokasi-lokasi olahraga terdekat dipetakan dengan marker interaktif.
- **WHEN** pengguna mengetikkan kata kunci pencarian pada search bar:
- **THEN** daftar lokasi dan pin peta disaring secara dinamis sesuai nama atau alamat lokasi yang cocok.

---

## 22. Status Assessed: Confirmed, Inferred & Unknown

| Domain / Komponen | Status | Catatan Validasi |
| :--- | :--- | :--- |
| **Arsitektur Next.js & Route Handlers** | **Confirmed from code** | Terverifikasi di `app/` dan `app/api/*`. |
| **Model Data & PostgreSQL Prisma** | **Confirmed from code** | Terverifikasi di `prisma/models/*.prisma` dan migrasi database. |
| **Formula Perhitungan Kesehatan** | **Confirmed from code** | Terverifikasi di `lib/kesehatan.ts` (Mifflin-St Jeor, faktor aktivitas, makro). |
| **Logika FitBot & Injeksi Profil** | **Confirmed from code** | Terverifikasi di `app/api/chat/route.ts` dan `components/ChatPanel.tsx`. |
| **Integrasi Open Food Facts** | **Confirmed from code** | Terverifikasi di `app/api/scan-makanan/lookup/route.ts`. |
| **Integrasi Cloudinary Upload** | **Confirmed from code** | Terverifikasi di `app/api/profile/upload` dan `app/api/upload/menu`. |
| **Target Pengguna & Persona Spesifik** | **Inferred** | Disimpulkan dari karakteristik fitur (pelaku diet, fitness enthusiast, pembaca kesehatan). |
| **Source Code Aplikasi Mobile Flutter** | **Inferred (Terpisah)** | Spesifikasi REST API & Dio client terdokumentasi lengkap di `FLUTTER_MOBILE_CONFIG.md`, namun source code aplikasi native Flutter dikelola di luar repositori Next.js ini. |
| **Rencana Monetisasi / Langganan Premium** | **Unknown / Needs Clarification** | Belum terdapat skema pembayaran, subscription model, atau paywall pada kode saat ini. |
