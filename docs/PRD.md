# FitLife — Product Requirements Document (PRD)

> **Document Status**: Complete & Aligned with Source Code  
> **Source of Truth**: Current Codebase (`bffabca` on branch `calc-bmi`)  
> **Last Updated**: 2026-10-10  
> **Project Name**: `project-fitlife` (v0.1.0)  
> **Framework & Runtime**: Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5.x, PostgreSQL, Prisma 7.4.2, Tailwind CSS v4, Redis (ioredis)

---

## Daftar Isi (Table of Contents)

1. [Product Overview](#1-product-overview)
2. [Product Goals](#2-product-goals)
3. [Existing Features](#3-existing-features)
4. [Target Users](#4-target-users)
5. [Main User Flows](#5-main-user-flows)
6. [Page / Route Inventory](#6-page--route-inventory)
7. [Navigation Structure](#7-navigation-structure)
8. [Feature Details](#8-feature-details)
9. [Existing UI / Design System](#9-existing-ui--design-system)
10. [Database Entities and Relationships](#10-database-entities-and-relationships)
11. [Prisma Schema and Important Models](#11-prisma-schema-and-important-models)
12. [API / Backend Integrations](#12-api--backend-integrations)
13. [Authentication and Authorization](#13-authentication-and-authorization)
14. [State Management and Data Flow](#14-state-management-and-data-flow)
15. [Important Business Rules](#15-important-business-rules)
16. [Dependencies and External Services](#16-dependencies-and-external-services)
17. [Platform / Environment Requirements](#17-platform--environment-requirements)
18. [Current Limitations or Known Issues](#18-current-limitations-or-known-issues)
19. [Important Technical Constraints](#19-important-technical-constraints)
20. [Feature-to-Page / Component Mapping](#20-feature-to-page--component-mapping)
21. [Acceptance Criteria for Existing Major Features](#21-acceptance-criteria-for-existing-major-features)

---

## 1. Product Overview

**FitLife** (dikenal di antarmuka sebagai *FitLife.id*) adalah platform digital kesehatan, nutrisi, dan kebugaran komprehensif berbasis web (Next.js App Router). Aplikasi dirancang untuk membantu masyarakat memantau status kesehatan fisik secara mandiri melalui perhitungan presisi BMI, BMR (Mifflin-St Jeor), dan estimasi kebutuhan energi harian (TDEE), menemukan rekomendasi resep makanan sehat yang disesuaikan dengan kondisi tubuh, mengeksplorasi fasilitas olahraga terdekat pada peta interaktif, memindai barcode produk makanan kemasan untuk memeriksa nutrisi dan alergen, serta berkonsultasi dengan asisten kesehatan berbasis kecerdasan buatan (**FitBot**).

Platform ini mengintegrasikan tiga ranah utama:
- **Client Web Portal** (`/(client)`): Pengalaman publik dan anggota terdaftar untuk menghitung parameter kesehatan, menelusuri menu, membaca artikel edukatif, mengecek peta fasilitas olahraga, riwayat scan makanan, dan asisten FitBot.
- **Admin Management Dashboard** (`/(admin)`): Panel pengelola terpusat untuk memantau metrik pengguna, memvalidasi dan memoderasi master produk barcode makanan (*Master Scan Makanan*), mengelola konten resep menu, artikel edukasi, peta fasilitas olahraga, dan manajemen akun pengguna.
- **RESTful API & Integration Layer** (`/api/*`): Layanan backend yang melayani aplikasi web client dan klien aplikasi mobile pendamping (Flutter) dengan dukungan otentikasi ganda (Cookie HTTP-only & Bearer Token), Redis 3-Tier Caching, integrasi Cloudinary, dan Open Food Facts API.

### Ringkasan Tech Stack

| Lapisan (Layer) | Teknologi & Pustaka | Keterangan / Status |
|---|---|---|
| **Core Framework** | Next.js 16.1.6 (App Router, Turbopack) | *Confirmed from code* |
| **Runtime & UI** | React 19.2.3, TypeScript 5.x | *Confirmed from code* |
| **Styling & Theme** | Tailwind CSS v4, `tw-animate-css`, `next-themes` (Obsidian Slate + Vital Emerald) | *Confirmed from code* |
| **Database & ORM** | PostgreSQL (Neon DB), Prisma 7.4.2 via `@prisma/adapter-pg` | *Confirmed from code* |
| **Caching Layer** | Redis 6.x via `ioredis` (3-tier lookup + aggregated stats cache) | *Confirmed from code* |
| **Otentikasi** | JWT (HS256 via `jose`), `bcryptjs` (salt 12), Google OAuth (`@react-oauth/google`) | *Confirmed from code* |
| **Validasi Skema** | Zod 4.3.6 | *Confirmed from code* |
| **Media Storage** | Cloudinary v2 SDK (`res.cloudinary.com`) | *Confirmed from code* |
| **Pemetaan (Maps)** | Leaflet 1.9.4, `react-leaflet` 5.0.0, Nominatim OpenStreetMap | *Confirmed from code* |
| **Rich Text Editor** | Tiptap 3.22 (Starter Kit, Image, Link, Color, CodeBlock) | *Confirmed from code* |
| **AI Conversational** | Groq Cloud API (`qwen/qwen3.8-27b`) dengan Zero-Token shortcut & guardrails | *Confirmed from code* |
| **Nutrisi Barcode** | Open Food Facts REST API v0 | *Confirmed from code* |
| **Testing Engine** | Vitest 4.1.7 (74 unit & integration tests) | *Confirmed from code* |

---

## 2. Product Goals

> **Status Identifikasi**: *Confirmed dari implementasi fitur, copy antarmuka, dan dokumentasi arsitektur.*

1. **Edukasi & Pemantauan Kesehatan Mandiri**: Menyediakan alat kalkulator kesehatan berbasis ilmiah (BMI, BMR Mifflin-St Jeor, TDEE, rentang berat ideal, dan distribusi makronutrien) dengan visualisasi intuitif WHO 4-Zone Gauge Meter tanpa hambatan pendaftaran (mendukung kalkulasi instan di sisi klien).
2. **Personalisasi Pola Makan Sehat**: Menghubungkan hasil kalkulasi kesehatan pengguna secara otomatis dengan resep makanan bergizi yang relevan sesuai target status gizi (*Kurus*, *Normal*, *Berlebih*, *Obesitas*).
3. **Pendorong Aktivitas Fisik Lokal**: Membantu pengguna menemukan fasilitas olahraga terdekat (Gym, Lapangan Olahraga, Area Low-Impact) menggunakan geolokasi peramban dan penentuan jarak Haversine.
4. **Transparansi Nutrisi Produk Kemasan**: Menghadirkan basis data makanan terverifikasi melalui pemindaian barcode dengan arsitektur 3-tier pencarian berkecepatan tinggi serta kurasi berbasis komunitas dan admin.
5. **Dukungan Asisten Kesehatan AI yang Aman & Efisien**: Memberikan panduan kebugaran dan jawaban cepat melalui FitBot dengan memprioritaskan privasi data, injeksi konteks riwayat fisik pengguna, dan efisiensi token melalui respon shortcut lokal.
6. **Platform Manajemen Terpadu**: Memberdayakan administrator untuk mengontrol kualitas data, meninjau kontribusi makanan pengguna, mempublikasikan artikel edukatif, dan memoderasi fasilitas kebugaran.

---

## 3. Existing Features

Tabel berikut merangkum seluruh fitur aplikasi dengan penandaan status kepastian:
- **[Confirmed from code]**: Terverifikasi langsung dari kode sumber, rute API, dan skema database.
- **[Inferred]**: Disimpulkan dari dependensi paket, parameter konfigurasi, atau alur UI pendukung.
- **[Unknown / Needs Clarification]**: Belum terdapat implementasi aktif atau memerlukan konfirmasi pengguna/infrastruktur.

| # | Fitur | Status Kepastian | Rincian Modul |
|---|---|---|---|
| 1 | **Kalkulator BMI, BMR, & TDEE Terpadu** | [Confirmed from code] | `lib/kesehatan.ts`, `/kalkulator`, gauge WHO 4-zone |
| 2 | **Rekomendasi Makronutrien Otomatis** | [Confirmed from code] | Distribusi protein, lemak, karbohidrat presisi IEEE-754 |
| 3 | **Penyimpanan Riwayat Kalkulasi Kesehatan** | [Confirmed from code] | Model `Perhitungan`, endpoint `/api/perhitungan` |
| 4 | **Grafik Riwayat BMI Interaktif** | [Confirmed from code] | Komponen `BMIRiwayatChart` pada `/kalkulator` |
| 5 | **Katalog Menu Makanan Sehat** | [Confirmed from code] | `/menu`, `/menu/[slug]`, filter `TargetStatus`, counter baca |
| 6 | **CMS Artikel Kesehatan Edukatif** | [Confirmed from code] | `/artikel`, `/artikel/[slug]`, filter kategori, featured highlight |
| 7 | **Peta Fasilitas Olahraga & Geolokasi** | [Confirmed from code] | `/lokasi`, Leaflet Map, Haversine formula, rute Google Maps |
| 8 | **3-Tier Food Barcode Lookup** | [Confirmed from code] | `/api/scan-makanan/lookup`, Tier 1 Redis, Tier 2 DB, Tier 3 OFF |
| 9 | **Riwayat & Kontribusi Scan Makanan** | [Confirmed from code] | `/scan-makanan`, `/api/scan-makanan/save`, upload Cloudinary |
| 10 | **Admin Master Scan Makanan Catalog** | [Confirmed from code] | `/admin/master-makanan`, verifikasi cepat, editing gizi, sinkronisasi Redis |
| 11 | **Admin Content CRUD (Menu, Artikel, Lokasi)** | [Confirmed from code] | `/admin/menu/*`, `/admin/artikel/*`, `/admin/lokasi/*` |
| 12 | **Admin User Management** | [Confirmed from code] | `/admin/pengguna`, `/api/accounts/*`, aktivasi & delete cascade |
| 13 | **Admin Analytics Dashboard** | [Confirmed from code] | `/admin/dashboard`, metrik pengguna, menu terpopuler, counter animasi |
| 14 | **FitBot AI Conversational Assistant** | [Confirmed from code] | `/api/chat`, Groq `qwen/qwen3.8-27b`, zero-token shortcuts, retry 429/503 |
| 15 | **Dual-Method Authentication (Email & Google)** | [Confirmed from code] | `/login`, `/register`, `/api/auth/*`, `@react-oauth/google` |
| 16 | **Dual-Channel Session Handling (Cookie & Bearer)** | [Confirmed from code] | `lib/auth.ts`, cookie HTTP-only (web) + Bearer header (mobile) |
| 17 | **Manajemen Profil Pengguna** | [Confirmed from code] | `/profile`, update fisik TB/BB, foto Cloudinary, ganti password |
| 18 | **Sistem Tema Dark & Light Mode (Health Theme)** | [Confirmed from code] | `app/globals.css`, Botanical Forest Dark `#0b1a14`, Leaf Emerald `#10b981` |
| 19 | **Database Seeding & Test Data Factories** | [Confirmed from code] | `prisma/seed.ts`, `prisma/factories/*` (menu, artikel, lokasi) |
| 20 | **Suite Pengujian Unit & Integrasi (74 Tests)** | [Confirmed from code] | Vitest 4.1.7 di direktori `__tests__` |
| 21 | **Ekspor Hasil Kesehatan ke Dokumen PDF** | [Inferred] | Dependensi `jspdf`, `jspdf-autotable`, `html2canvas` terpasang di `package.json` |
| 22 | **Integrasi Klien Aplikasi Mobile (Flutter)** | [Inferred] | Dukungan Bearer token di `lib/auth.ts`, variabel `NEXT_PUBLIC_FITLIFE_MOBILE_APP_URL` |
| 23 | **Rate Limiting Global pada API** | [Unknown / Needs Clarification] | Belum terdapat middleware rate limit terpusat (hanya retry backoff di Groq) |
| 24 | **Verifikasi Email & Reset Password via Email** | [Unknown / Needs Clarification] | Akun langsung aktif tanpa verifikasi email; belum ada flow lupa password |

---

## 4. Target Users

> **Status Identifikasi**: *Inferred dari bahasa antarmuka (Bahasa Indonesia), alur kerja, dan perizinan sistem.*

| Segmen Pengguna | Profil & Kebutuhan | Peran & Akses Sistem |
|---|---|---|
| **Masyarakat Umum / Pengunjung Publik** | Individu yang ingin memeriksa status berat badan secara cepat, mencari inspirasi resep bergizi, dan membaca tips gaya hidup sehat tanpa wajib mendaftar. | Akses publik (`guest`): Menghitung BMI instan (tanpa penyimpanan), membaca menu, artikel, dan peta lokasi. |
| **Anggota Komunitas Terdaftar** | Individu yang aktif menjaga kebugaran, ingin mencatat riwayat perkembangan berat badan dari waktu ke waktu, menyimpan produk makanan hasil scan, dan berkonsultasi dengan FitBot. | Akses terautentikasi (`role: "user"`): CRUD riwayat kalkulasi, simpan scan barcode, kontribusi data produk makanan, konsultasi FitBot, update profil fisik. |
| **Administrator Platform** | Tim pengelola operasional yang bertugas memvalidasi katalog produk barcode, mempublikasikan artikel edukasi, mengelola resep makanan sehat, dan mengawasi akun pengguna. | Akses manajerial (`role: "admin"`): Dashboard analitik, CRUD master scan makanan, CRUD artikel (Tiptap), CRUD menu, CRUD lokasi (Map Picker), moderasi akun. |

---

## 5. Main User Flows

### Flow 1: Perhitungan Kesehatan & Rekomendasi Terpadu (`/kalkulator`)

```mermaid
flowchart TD
    A["Buka Halaman /kalkulator"] --> B["Masukkan Gender, TB, BB, Usia, Tingkat Aktivitas"]
    B --> C["Kalkulasi Instan di Browser (lib/kesehatan.ts)"]
    C --> D["Tampilkan Gauge WHO 4-Zone, BMR, TDEE, Makronutrien"]
    D --> E{"Status Sesi Pengguna?"}
    E -- Login --> F["Kirim POST /api/perhitungan"]
    F --> G["Data Tersimpan di DB & Update Profil TB/BB"]
    G --> H["Tampilkan Grafik Riwayat BMI & Tab Makanan Rekomendasi"]
    E -- Belum Login --> I["Tampilkan Hasil Preview Saja + CTA Login"]
    H --> J["Muat Peta Fasilitas Olahraga Relevan Berdasarkan Status BMI"]
    I --> J
```

### Flow 2: 3-Tier Barcode Scan Makanan & Pencarian Nutrisi

```mermaid
flowchart TD
    A["Pengguna Input Barcode / Scan Produk"] --> B["Kirim POST /api/scan-makanan/lookup"]
    B --> C{"Cek Tier 1: Redis Global Cache?"}
    C -- Cache HIT --> D["Kembalikan Data Produk (Header: X-Cache: HIT)"]
    C -- Cache MISS --> E{"Cek Tier 2: Database Master Komunitas (master_makanan)?"}
    E -- Ditemukan di DB --> F["Simpan ke Redis Cache (TTL 7 Hari)"]
    F --> G["Increment counter scan_count di DB"]
    G --> D
    E -- Tidak Ditemukan --> H{"Cek Tier 3: Open Food Facts API Eksternal?"}
    H -- Ditemukan --> I["Normalisasi Data Gizi per 100g"]
    I --> J["Upsert ke Tabel master_makanan & Simpan ke Redis Cache"]
    J --> D
    H -- Tidak Ditemukan --> K["Kembalikan Status 404 (Produk Tidak Terdaftar)"]
    D --> L{"Pengguna Terautentikasi?"}
    L -- Ya --> M["Opsi Simpan ke Riwayat Pribadi: POST /api/scan-makanan/save"]
    L -- Tidak --> N["Tampilkan Hasil Nutrisi di Layar Saja"]
```

### Flow 3: Kurasi & Verifikasi Master Makanan oleh Admin

```mermaid
flowchart TD
    A["Admin Buka /admin/master-makanan"] --> B["Ambil Data GET /api/admin/master-makanan (Filter/Search/Sort)"]
    B --> C["Tampilkan Metrik Statistik (Total, Verified, Community, Scans)"]
    C --> D{"Pilihan Tindakan Admin"}
    D -- Verifikasi Cepat --> E["Klik Tombol Verifikasi Cepat (Status 'verified')"]
    D -- Edit Informasi Gizi --> F["Buka Modal Edit (Perbarui Nilai Kalori/P/L/K/Gula)"]
    D -- Tambah Produk Manual --> G["Buka Modal Tambah Produk (Upload Foto ke Cloudinary)"]
    D -- Hapus Produk --> H["Konfirmasi Hapus Produk dari Katalog"]
    E --> I["PUT /api/admin/master-makanan/:id + Update DB"]
    F --> I
    G --> J["POST /api/admin/master-makanan + Simpan ke DB"]
    H --> K["DELETE /api/admin/master-makanan/:id + Hapus dari DB"]
    I --> L["Perbarui Cache Redis Terkait (food:barcode:X) & Invalidate Statistik"]
    J --> L
    K --> M["Hapus Kunci Cache Redis (food:barcode:X) & Invalidate Statistik"]
```

### Flow 4: Konsultasi FitBot AI dengan Zero-Token Shortcut

```mermaid
flowchart TD
    A["Pengguna Klik Floating Chat Button"] --> B{"Pemeriksaan Login?"}
    B -- Belum Login --> C["Tampilkan Pesan Peringatan Wajib Login"]
    B -- Terautentikasi --> D["Pengguna Mengirim Pertanyaan"]
    D --> E{"Pencocokan Pesan Shortcut Lokal?"}
    E -- 'cek tinggi & berat badan' --> F["Ambil TB & BB dari Akun DB Langsung (0 Token LLM)"]
    E -- 'status bmi terakhir' --> G["Ambil Hasil Kalkulasi Terakhir DB (0 Token LLM)"]
    E -- 'hitung kalori harian' --> H["Hitung Rumus Mifflin-St Jeor DB (0 Token LLM)"]
    E -- Pertanyaan Bebas --> I["Ambil Profil Fisik + Riwayat Chat (Sliding Window 4 Pesan)"]
    I --> J["Kirim ke Groq Cloud API (qwen/qwen3.8-27b, max 350 token)"]
    J --> K{"Status Respons HTTP?"}
    K -- 200 OK --> L["Tampilkan Respons Asisten di Chat Window"]
    K -- 429 / 503 --> M["Jalankan Exponential Backoff Retry (Maksimal 3 Kali: 2s, 4s, 8s)"]
    M --> L
    F --> L
    G --> L
    H --> L
```

---

## 6. Page / Route Inventory

### 6.1. Client-Facing Routes (`app/(client)`)

| Rute URL | Komponen Utama | Aksesibilitas | Deskripsi Fungsional |
|---|---|---|---|
| `/` | `Home` (`page.tsx`) | Publik | Halaman beranda dengan hero interaktif, *Live Health Snapshot* card, 4 pilar hidup sehat, 3 langkah kebugaran, dan showcase konten terbaru. |
| `/kalkulator` | `KalkulatorBMIPage` (`page.tsx`) | Publik & Member | Kalkulator BMI/BMR/TDEE dengan WHO 4-zone gauge meter, estimasi makrogizi, grafik riwayat, tab menu rekomendasi, dan peta fasilitas olahraga terdekat. |
| `/menu` | `MenuPage` (`page.tsx`) | Publik | Direktori resep makanan sehat dengan pencarian teks (debounce 400ms), filter kategori status gizi, dan paginasi kartu resep. |
| `/menu/[slug]` | `MenuDetailPage` (`page.tsx`) | Publik | Detail lengkap resep menu: foto, kalori, waktu masak, deskripsi bahan & instruksi, serta rekomendasi menu serupa. Otomatis menambah counter pembaca. |
| `/artikel` | `ArtikelPage` (`page.tsx`) | Publik | Portal artikel edukatif dengan artikel unggulan (*featured banner*), filter kategori dinamis, dan pencarian artikel. |
| `/artikel/[slug]` | `ArtikelDetailPage` (`page.tsx`) | Publik | Tampilan artikel lengkap dengan format kaya HTML (Tiptap render), data penulis, tanggal publikasi, dan artikel terkait. Otomatis menambah counter baca. |
| `/lokasi` | `LokasiPage` (`page.tsx`) | Publik | Peta interaktif fasilitas olahraga berbasis Leaflet dengan geolokasi browser, perhitungan jarak, filter kategori (gym, lapangan, low_impact), dan tautan Google Maps. |
| `/scan-makanan` | `ScanMakananPage` (`page.tsx`) | Publik & Member | Halaman pemindaian barcode produk makanan kemasan, ringkasan informasi gizi produk, dan daftar riwayat pemindaian pribadi pengguna. |
| `/profile` | `ProfilePage` (`page.tsx`) | Terautentikasi | Pengaturan data akun pengguna: nama, username unik, telepon, tanggal lahir, update fisik TB/BB, upload avatar ke Cloudinary, dan ubah kata sandi. |

### 6.2. Authentication Routes (`app/(auth)`)

| Rute URL | Komponen Utama | Aksesibilitas | Deskripsi Fungsional |
|---|---|---|---|
| `/login` | `LoginPage` / `LoginClient` | Publik (Guest) | Formulir masuk menggunakan email & password atau tombol masuk sekali klik dengan Google OAuth. |
| `/register` | `RegisterPage` | Publik (Guest) | Formulir pendaftaran akun baru dengan validasi Zod (nama min 2 karakter, email valid, password min 8 karakter kombinasi huruf & angka) serta pendaftaran Google OAuth. |

### 6.3. Admin Management Routes (`app/(admin)/admin`)

| Rute URL | Komponen Utama | Aksesibilitas | Deskripsi Fungsional |
|---|---|---|---|
| `/admin/dashboard` | `BerandaPage` (`page.tsx`) | Khusus Admin | Dasbor analitik dengan kartu metrik animated-counter (Total User, User Aktif, Total Menu, Total Artikel), 5 pengguna terbaru, dan 5 menu terpopuler. |
| `/admin/master-makanan` | `MasterMakananPage` (`page.tsx`) | Khusus Admin | Manajemen katalog master barcode makanan: pencarian, filter sumber, sorting, verifikasi cepat status resmi, modal edit gizi, dan penambahan produk baru. |
| `/admin/menu` | `MenuPage` (`page.tsx`) | Khusus Admin | Tabel data resep menu sehat dengan paginasi, pencarian, dan tombol aksi hapus/edit. |
| `/admin/menu/create` | `CreateMenuPage` (`page.tsx`) | Khusus Admin | Formulir penambahan menu baru dengan upload foto Cloudinary, input kalori, waktu memasak, dan target status gizi. |
| `/admin/menu/[slug]/edit` | `EditMenuPage` (`page.tsx`) | Khusus Admin | Formulir perbaikan data menu resep yang sudah ada. |
| `/admin/artikel` | `ArtikelPage` (`page.tsx`) | Khusus Admin | Tabel artikel kesehatan dengan status unggulan (*featured*), jumlah dibaca, dan aksi kelola. |
| `/admin/artikel/create` | `CreateArtikelPage` (`page.tsx`) | Khusus Admin | Formulir pembuatan artikel dengan Rich Text Editor Tiptap (formatting teks, gambar, tautan, code block). |
| `/admin/artikel/[slug]/edit` | `EditArtikelPage` (`page.tsx`) | Khusus Admin | Formulir penyuntingan artikel dan pembaruan banner/konten. |
| `/admin/lokasi` | `LokasiAdminPage` (`page.tsx`) | Khusus Admin | Tabel data fasilitas olahraga dengan koordinat geografis dan kategori. |
| `/admin/lokasi/create` | `CreateLokasiPage` (`page.tsx`) | Khusus Admin | Formulir penambahan lokasi olahraga baru dengan pemilih pin peta interaktif (`LokasiPickerMap`) dan geocoding balik Nominatim. |
| `/admin/lokasi/[id]/edit` | `EditLokasiPage` (`page.tsx`) | Khusus Admin | Formulir penyuntingan data lokasi dan reposisi koordinat peta. |
| `/admin/pengguna` | `PenggunaPage` (`page.tsx`) | Khusus Admin | Tabel daftar seluruh pengguna terdaftar, saklar aktivasi/penangguhan akun, dan penghapusan permanen akun. |
| `/admin/profile` | `AdminProfilePage` (`page.tsx`) | Khusus Admin | Pengaturan profil akun administrator dan pergantian kata sandi. |

### 6.4. API Endpoints (`app/api`)

| Endpoint API | Metode HTTP | Tingkat Akses | Deskripsi & Operasi Data |
|---|---|---|---|
| `/api/auth/register` | `POST` | Publik | Mendaftarkan akun lokal baru dengan enkripsi kata sandi `bcryptjs`. |
| `/api/auth/login` | `POST` | Publik | Verifikasi kredensial lokal dan penerbitan token JWT cookie (7 hari). |
| `/api/auth/google` | `POST` | Publik | Otentikasi Google OAuth untuk Web (`access_token`) dan Mobile (`id_token`). |
| `/api/auth/me` | `GET` | Terautentikasi | Mengambil identitas pengguna yang sedang masuk dari token sesi. |
| `/api/auth/logout` | `POST` | Publik | Menghapus cookie sesi `token` dan mengakhiri sesi. |
| `/api/profile` | `GET`, `PATCH` | Terautentikasi | Membaca dan memperbarui atribut profil fisik (nama, username, HP, TB, BB, tgl lahir). |
| `/api/profile/password` | `PATCH` | Terautentikasi | Memperbarui kata sandi akun lokal dengan verifikasi kata sandi lama. |
| `/api/profile/upload` | `POST` | Terautentikasi | Mengunggah foto avatar pengguna ke Cloudinary (auto-crop 400x400 face focus). |
| `/api/perhitungan` | `GET`, `POST`, `DELETE` | Terautentikasi / Publik | Menghitung parameter gizi, menyimpan ke DB, dan mengambil 10 riwayat kalkulasi terakhir. |
| `/api/menus` | `GET`, `POST` | Publik (GET), Admin (POST) | Mengambil daftar resep berpaginasi dan membuat menu resep baru. |
| `/api/menus/[slug]` | `GET`, `PUT`, `DELETE` | Publik (GET), Admin (PUT/DEL) | Mengambil detail menu, memperbarui data, atau menghapus menu. |
| `/api/upload/menu` | `POST` | Terautentikasi / Admin | Mengunggah gambar resep makanan ke folder Cloudinary `fitlife/menus`. |
| `/api/artikels` | `GET`, `POST` | Publik (GET), Admin (POST) | Mengambil daftar artikel berpaginasi dan mempublikasikan artikel baru. |
| `/api/artikels/[slug]` | `GET`, `PUT`, `DELETE` | Publik (GET), Admin (PUT/DEL) | Mengambil detail artikel, menyunting isi artikel, atau menghapus artikel. |
| `/api/lokasi-olahraga` | `GET`, `POST` | Publik (GET), Admin (POST) | Mengambil daftar fasilitas olahraga atau mendaftarkan lokasi baru. |
| `/api/lokasi-olahraga/[id]` | `GET`, `PUT`, `DELETE` | Publik (GET), Admin (PUT/DEL) | Mengambil detail lokasi, mengubah koordinat/alamat, atau menghapus lokasi. |
| `/api/scan-makanan/lookup` | `POST` | Publik | Pencarian gizi barcode 3-Tier (Redis Cache -> DB Master -> Open Food Facts). |
| `/api/scan-makanan/save` | `POST` | Terautentikasi | Menyimpan produk hasil pemindaian ke riwayat pribadi & sinkronisasi ke DB master. |
| `/api/scan-makanan/upload` | `POST` | Terautentikasi | Mengunggah foto produk makanan ke folder Cloudinary `fitlife/foods`. |
| `/api/scan-makanan` | `GET`, `DELETE` | Terautentikasi | Mengambil daftar riwayat scan pribadi pengguna dan menghapus item riwayat. |
| `/api/admin/master-makanan` | `GET`, `POST` | Khusus Admin | Mengambil daftar master makanan berpaginasi/filter/sort dan menambah produk baru. |
| `/api/admin/master-makanan/[id]` | `GET`, `PUT`, `DELETE` | Khusus Admin | Detail produk, ubah data/status verifikasi cepat, dan hapus dari master + Redis. |
| `/api/admin/dashboard` | `GET` | Khusus Admin | Mengambil metrik agregat dasbor (pengguna, menu terpopuler, artikel). |
| `/api/accounts` | `GET` | Khusus Admin | Mengambil seluruh daftar akun terdaftar dengan parameter pencarian dan status. |
| `/api/accounts/[id]` | `PATCH`, `DELETE` | Khusus Admin | Mengubah status aktif/nonaktif akun atau menghapus akun secara permanen (cascade). |
| `/api/chat` | `POST` | Terautentikasi | Endpoint percakapan FitBot AI dengan shortcut lokal dan integrasi Groq Cloud. |

---

## 7. Navigation Structure

### 7.1. Navigasi Client (`components/client/Navigasi.tsx`)

Header navigasi berada di posisi `sticky top-0 z-[1010]` dengan efek latar transparan `backdrop-blur-md`:
```
[Brand Logo: FitLife.id]
  ├── Home (/)
  ├── Kalkulator BMI (/kalkulator)
  ├── Menu Sehat (/menu)
  ├── Artikel (/artikel)
  ├── Lokasi (/lokasi)
  └── Riwayat Scan (/scan-makanan) [Ikon ScanLine]
  ── [Theme Toggle Button: Sun/Moon]
  ── [NavProfile Component: Dropdown Avatar Pengguna / Tombol Masuk]
```
- **Komponen NavProfile**: Jika belum login menampilkan tombol `Masuk` dan `Daftar`. Jika sudah login menampilkan avatar foto, nama akun, menu link ke `/profile`, dan opsi `Keluar`. Mendengarkan custom event window `profile:updated` untuk sinkronisasi avatar langsung tanpa reload.
- **Floating Chatbot Button**: Tombol mengambang di kanan bawah yang memicu overlay percakapan FitBot AI.

### 7.2. Navigasi Admin (`components/admin/sidebar.tsx`)

Sidebar navigasi berada di sisi kiri (`w-64`) dengan dukungan penarikan mobile drawer:
```
[Brand Logo: FitLife Admin]
  ├── 1. Beranda (/admin/dashboard) [Ikon Home]
  ├── 2. Master Scan Makanan (/admin/master-makanan) [Ikon ScanBarcode]
  ├── 3. Menu Sehat (/admin/menu) [Ikon Utensils]
  ├── 4. Artikel (/admin/artikel) [Ikon NotebookText]
  ├── 5. Lokasi Olahraga (/admin/lokasi) [Ikon MapPin]
  └── 6. Pengguna (/admin/pengguna) [Ikon Users]
  ── [Profil Admin Link: /admin/profile]
  ── [Tombol Logout dengan Konfirmasi Loading State]
```

---

## 8. Feature Details

### 8.1. Kalkulator Kesehatan Multi-Parameter (`/kalkulator`)
- **Masukan Data**: Gender (*pria/wanita*), Tinggi Badan (*cm*), Berat Badan (*kg*), Usia (*tahun*), dan Tingkat Aktivitas Fisik (*rebahan, ringan, sedang, berat*).
- **Logika Perhitungan Instan**: Dijalankan langsung di browser menggunakan fungsi murni `hitungAnalisisKesehatan()` dalam `lib/kesehatan.ts`. Tidak memerlukan round-trip jaringan untuk melihat hasil visual awal.
- **WHO 4-Zone Curved Gauge Meter**: Jarum penunjuk visual melengkung interaktif yang memetakan nilai BMI ke dalam 4 zona warna terstandar WHO:
  - *Kurus (Underweight)*: `< 18.5` (Biru Lembut)
  - *Normal (Healthy Weight)*: `18.5 – < 25.0` (Emerald Sehat)
  - *Berlebih (Overweight)*: `25.0 – < 30.0` (Kuning-Amber)
  - *Obesitas (Obese)*: `≥ 30.0` (Merah-Rose)
- **Kartu Metrik Lengkap**:
  - **BMR (Basal Metabolic Rate)**: Dihitung menggunakan persamaan Mifflin-St Jeor.
  - **TDEE (Total Daily Energy Expenditure)**: BMR dikalikan faktor aktivitas harian (1.2, 1.375, 1.55, 1.725).
  - **Rentang Berat Badan Ideal**: Rentang aman BMI normal `[18.5 × TB(m)², 24.9 × TB(m)²]`.
  - **Distribusi Makronutrien Harian**: Rekomendasi gramatur protein (`1.4g × BB`), lemak (`30% TDEE / 9`), dan karbohidrat dari sisa kalori harian (`(TDEE - (P×4) - (L×9)) / 4`).
- **Integrasi Konten**: Menampilkan tab menu rekomendasi yang sesuai dengan target status gizi dan memuat peta Leaflet lokasi olahraga terdekat sesuai kebutuhan latihan fisik.

### 8.2. Arsitektur Pemindaian Barcode 3-Tier (`/scan-makanan` & `/api/scan-makanan/*`)
- **Tier 1 (Redis In-Memory Cache)**: Pencarian instan berdasarkan kunci `food:barcode:<barcode>` dengan TTL 7 hari. Menghasilkan latensi < 15ms.
- **Tier 2 (Database Master Komunitas)**: Memeriksa tabel `master_makanan`. Jika ditemukan, counter `scan_count` ditambah secara asinkron dan data disimpan ulang ke Redis cache.
- **Tier 3 (Open Food Facts API)**: Fallback otomatis ke API publik Open Food Facts. Data yang berhasil diambil dinormalisasi per 100g, di-upsert ke database `master_makanan`, dan di-cache ke Redis.
- **Klasifikasi Sumber Produk**:
  - `verified`: Diverifikasi langsung oleh tim kurator administrator FitLife.
  - `community`: Kontribusi data dari pengguna aplikasi web atau mobile.
  - `openfoodfacts`: Bersumber dari basis data terbuka global Open Food Facts.
- **Upload Media Produk**: Endpoint `/api/scan-makanan/upload` menerima foto produk (maksimal 5MB, format JPG/PNG/WEBP) dan menyimpannya di Cloudinary folder `fitlife/foods`.

### 8.3. Admin Master Scan Makanan (`/admin/master-makanan`)
- **Dashboard Statistik Agregat**: Kartu metrik total produk dalam katalog, produk berstatus terverifikasi resmi, produk hasil kontribusi komunitas, produk dari database Open Food Facts, dan akumulasi total frekuensi pemindaian (didukung cache Redis 60 detik `admin:stats:master_makanan`).
- **Fitur Toolbar & Filter**: Pencarian teks debounce 400ms pada barcode/nama/brand, tab filter sumber, dan dropdown pengurutan (`scan_count`, `created_at`, `nama_makanan`).
- **Verifikasi Cepat (Quick Verify)**: Tombol aksi langsung untuk menaikkan status produk komunitas menjadi `verified` dengan pembaruan cache Redis seketika.
- **Modal Editing Gizi**: Modal antarmuka untuk menyesuaikan nilai nutrisi makro (Kalori, Protein, Lemak, Karbohidrat, Gula).
- **Penghapusan Bersih**: Menghapus produk dari database sekaligus menghapus kunci cache terkait di Redis.

### 8.4. FitBot AI Health Assistant (`/api/chat`)
- **Model Dasar**: Groq Cloud LLM `qwen/qwen3.8-27b` dengan pembatasan suhu rendah (`temperature: 0.2`) dan batas keluaran padat (`max_tokens: 350`).
- **Zero-Token Local Shortcuts**: Menangani perintah spesifik secara lokal tanpa memanggil LLM:
  - `"cek tinggi & berat badan"`: Menampilkan data fisik pengguna dari database.
  - `"status bmi terakhir"`: Menampilkan riwayat kalkulasi terakhir dari database.
  - `"hitung kalori harian"`: Melakukan perhitungan Mifflin-St Jeor lokal.
- **Injeksi Konteks Profil**: Menyuntikkan rangkuman data fisik terkini (Nama, TB, BB, skor BMI terakhir) ke dalam *system prompt* (~80 token) untuk personalisasi jawaban.
- **Guardrails Ketat**: Sistem secara eksplisit menolak topik di luar kesehatan, nutrisi, makanan sehat, diet, dan kebugaran, serta menolak permintaan penulisan kode/pemrograman.
- **Ketahanan Jaringan (Resilience)**: Menerapkan mekanisme *exponential backoff retry* (maksimal 3 kali: 2s, 4s, 8s) ketika menemui status HTTP 429 (rate limit) atau 503 (overload).

---

## 9. Existing UI / Design System

### 9.1. Filosofi & Token Desain (Health & Wellness Theme)

Sistem antarmuka FitLife menggunakan **Tailwind CSS v4** dengan palet warna klinis alami bertema kebugaran (*Health & Wellness*):

| Kategori Token | Nama Token CSS | Nilai Warna (Light Mode) | Nilai Warna (Dark Mode) | Karakteristik & Penggunaan |
|---|---|---|---|---|
| **Primary Brand** | `--color-primary` / `--primary` | `#10b981` | `#10b981` | Vital Emerald (Daun Alami), aksen utama dan tombol aksi. |
| **Primary Hover** | `--color-primary-hover` | `#059669` | `#059669` | Emerald Gelap untuk status hover interaktif. |
| **Latar Belakang** | `--background` | `#f8fafc` (Slate 50) | `#0b1a14` (Botanical Dark Green) | Latar dasar non-agresif dengan nuansa hijau botani alami yang sejuk. |
| **Kartu / Surface** | `--card` | `#ffffff` (Putih Bersih) | `#11261d` (Forest Pine Card) | Latar kontainer komponen dan kartu data. |
| **Garis / Border** | `--border` / `--color-card-border` | `#e2e8f0` (Slate 200) | `#1c3e30` (Herbal Green Border) | Garis tepi halus dengan kontras seimbang. |
| **Teks Utama** | `--foreground` / `--color-text-light` | `#0f172a` (Slate 900) | `#f2f9f5` (Fresh Mint White) | Keterbacaan tinggi untuk judul dan angka penting. |
| **Teks Sekunder** | `--muted-foreground` / `--color-text-muted` | `#64748b` (Slate 500) | `#8fa89b` (Soft Sage) | Label keterangan dan teks pelengkap. |

### 9.2. Tipografi & Radius
- **Font Utama**: `Inter` (`--font-sans`, sans-serif) yang dimuat via Google Fonts.
- **Radius Sudut**: `--radius: 0.5rem` (base), `--radius-xl: 1rem` (kontainer sedang), `--radius-2xl: 1.5rem` (kartu utama & modal).

### 9.3. Komponen Pustaka Antarmuka (Component Library)

| Nama Komponen | Sumber / Pustaka | Peruntukan Fungsional |
|---|---|---|
| `Button`, `Card`, `Input`, `Label` | shadcn/ui (CVA + Tailwind) | Elemen formulir dasar, kartu metrik, dan tombol interaksi. |
| `RichTextEditor` | Kustom (`@tiptap/*`) | Editor artikel dengan toolbar (Heading, List, Image, Color, Code). |
| `LokasiPickerMap` | Kustom (`leaflet`, OSM) | Pemilih koordinat interaktif admin dengan reverse geocoding Nominatim. |
| `LokasiMap` | Kustom (`leaflet`, OpenStreetMap) | Tampilan peta fasilitas olahraga publik dengan marker kustom dan link rute. |
| `BMIRiwayatChart` | Kustom (Canvas / SVG) | Visualisasi tren perkembangan indeks massa tubuh pengguna. |
| `HomeRecentContent` | Kustom | Showcase artikel dan menu terkini di halaman beranda. |
| `NavProfile` | Kustom | Dropdown profil pengguna dengan sinkronisasi avatar seketika. |
| `ThemeProvider` | `next-themes` | Penyedia konteks peralihan Light Mode dan Dark Mode. |
| `Toaster` | `sonner` | Notifikasi mengambang (*rich toast*) untuk umpan balik aksi. |

---

## 10. Database Entities and Relationships

Arsitektur database FitLife dikelola oleh PostgreSQL dan dimodelkan secara terpisah di dalam direktori `prisma/models/`:

```mermaid
erDiagram
    Account ||--o{ Perhitungan : "memiliki riwayat"
    Account ||--o{ LokasiOlahraga : "mendaftarkan lokasi"
    Account ||--o{ ScanMakanan : "menyimpan riwayat scan"
    Account ||--o{ MasterMakanan : "berkontribusi produk"
    Menu }o--|| TargetStatus : "diklasifikasikan oleh"

    Account {
        int id PK
        string name
        string username UK
        string email UK
        string google_id
        string role "user | admin"
        string password "bcrypt hash"
        boolean is_active "default: true"
        datetime last_login_at
        string phone
        datetime birthdate
        int weight "dalam kg"
        int height "dalam cm"
        string photo "URL Cloudinary"
        string google_avatar
        datetime created_at
        datetime updated_at
    }

    Menu {
        int id PK
        string nama_menu
        string slug UK
        text deskripsi
        int kalori "kkal"
        enum target_status "Kurus|Normal|Berlebih|Obesitas"
        int waktu_memasak "menit"
        int biaya_per_porsi "Rp"
        int dibaca "counter tayangan"
        string gambar "URL Cloudinary"
        datetime created_at
        datetime updated_at
    }

    Artikel {
        int id PK
        string judul
        string slug UK
        string kategori
        string penulis "default: Admin"
        text isi "HTML Tiptap"
        string gambar "URL Cloudinary"
        boolean is_featured "default: false"
        int dibaca "counter tayangan"
        datetime created_at
        datetime updated_at
    }

    LokasiOlahraga {
        int id PK
        string name
        string category "lapangan|gym|low_impact"
        string address
        float latitude
        float longitude
        int user_id FK
        datetime created_at
        datetime updated_at
    }

    MasterMakanan {
        int id PK
        string barcode UK "index unik"
        string nama_makanan
        string brand
        string image_url
        float kalori "kkal per 100g"
        float protein "gram"
        float lemak "gram"
        float karbohidrat "gram"
        float gula "gram"
        string source "community|openfoodfacts|verified"
        int contributor_id FK
        int scan_count "frekuensi dipindai"
        datetime created_at
        datetime updated_at
    }

    Perhitungan {
        int id PK
        int user_id FK
        float tinggi_badan
        float berat_badan
        float bmi
        string status "Kurus|Normal|Berlebih|Obesitas"
        string gender
        int usia
        string aktivitas
        float bmr
        float tdee
        float target_kalori
        float berat_min
        float berat_max
        float protein
        float karbohidrat
        float lemak
        datetime created_at
        datetime updated_at
    }

    ScanMakanan {
        int id PK
        int user_id FK
        string barcode
        string nama_makanan
        string brand
        string image_url
        float kalori
        float protein
        float lemak
        float karbohidrat
        float gula
        datetime created_at
    }
```

### Aturan Relasi & Integritas Data
- **Cascade Delete**: Menghapus `Account` secara otomatis menghapus seluruh rekaman anak pada tabel `Perhitungan`, `LokasiOlahraga`, dan `ScanMakanan`.
- **Set Null pada Kontribusi**: Jika akun dihapus, relasi `contributor_id` pada tabel `MasterMakanan` diatur menjadi `NULL` (`onDelete: SetNull`) agar data katalog produk tidak hilang.
- **Entitas Mandiri**: Entitas `Menu` dan `Artikel` beroperasi sebagai katalog independen tanpa ketergantungan relasi langsung ke akun pembuat.

---

## 11. Prisma Schema and Important Models

- **Konfigurasi Generator**: Menggunakan `prisma-client` dengan berkas keluaran khusus ke `../generated/prisma`. Diimpor ke seluruh kode menggunakan path alias `@/lib/prisma`.
- **Datasource**: PostgreSQL menggunakan adaptor koneksi langsung `@prisma/adapter-pg`.
- **Struktur Multi-File Skema**: Model database dipisahkan secara modular ke dalam direktori `prisma/models/`:
  1. `account.prisma`: Entitas pengguna, autentikasi lokal, Google OAuth, data fisik tubuh.
  2. `menu.prisma`: Resep makanan sehat, enum `TargetStatus`, dan nutrisi kalori.
  3. `artikel.prisma`: Artikel kesehatan edukatif, slug unik, dan status unggulan.
  4. `lokasiOlahraga.prisma`: Fasilitas olahraga dengan koordinat lintang & bujur.
  5. `masterMakanan.prisma`: Basis data master barcode makanan kemasan, status verifikasi, dan pelacak kontributor.
  6. `perhitungan.prisma`: Riwayat analisis kesehatan, parameter BMI/BMR/TDEE dan makronutrien.
  7. `scanMakanan.prisma`: Riwayat pemindaian barcode pribadi milik pengguna.
- **Riwayat Migrasi Resmi**:
  1. `20260318173822_add_slug_menu`: Skema awal akun, menu, artikel, dan perhitungan.
  2. `20260414135955_add_lokasi_favorit`: Penambahan tabel `lokasi_olahraga`.
  3. `20260919112000_add_scan_makanan`: Penambahan tabel `scan_makanan`.
  4. Sinkronisasi tabel `master_makanan` via Prisma schema push.

---

## 12. API / Backend Integrations

### 12.1. Layanan Eksternal & Integrasi Pihak Ketiga

| Nama Layanan | Tujuan & Peruntukan | Jalur Integrasi & Komponen |
|---|---|---|
| **Redis (Upstash / Local)** | In-memory cache produk barcode (TTL 7 hari) dan cache statistik agregat admin (TTL 60s). | `lib/redis.ts`, dipanggil di `/api/scan-makanan/lookup` dan `/api/admin/master-makanan/*`. |
| **Cloudinary v2 SDK** | Penyimpanan aset gambar teroptimasi: avatar profil, gambar menu, dan foto produk makanan. | `/api/profile/upload`, `/api/upload/menu`, `/api/scan-makanan/upload`. |
| **Open Food Facts API** | Pencarian data gizi produk barcode internasional sebagai fallback Tier 3. | `lib/openfoodfacts.ts`, dipanggil di `/api/scan-makanan/lookup`. |
| **Groq Cloud API** | Inferensi percakapan model bahasa besar (`qwen/qwen3.8-27b`) untuk asisten FitBot. | `app/api/chat/route.ts` dengan sistem retry exponential backoff. |
| **Google Identity Services** | Otentikasi masuk sosial untuk Web (`oauth2/v3/userinfo`) dan Mobile (`tokeninfo`). | `app/api/auth/google/route.ts`. |
| **OpenStreetMap / Nominatim** | Penyedia peta jalan Leaflet dan API reverse geocoding gratis. | `LokasiPickerMap.tsx`, `LokasiMap.tsx`. |

---

## 13. Authentication and Authorization

### 13.1. Mekanisme Token JWT
- **Pustaka Pembuat**: `jose` (enkripsi simetris HS256).
- **Kunci Rahasia**: Didefinisikan pada variabel lingkungan `JWT_SECRET`.
- **Payload Token**:
  ```typescript
  export type JWTPayload = {
    userId: number;
    role: string; // "user" | "admin"
    email: string;
  };
  ```
- **Masa Berlaku (Expiry)**: 7 hari sejak diterbitkan.
- **Penyimpanan Sesi Web**: Disimpan dalam cookie HTTP-only bernama `token` dengan atribut `sameSite: "lax"`, `path: "/"`.

### 13.2. Resolusi Otentikasi Ganda (`getAuthUser`)
Fungsi utilitas `getAuthUser(request: Request)` dalam `lib/auth.ts` menyelesaikan sesi pengguna dengan urutan prioritas:
1. Memeriksa header HTTP `Authorization: Bearer <token>` (digunakan oleh klien aplikasi mobile dan integrasi API).
2. Jika header tidak tersedia, memeriksa kuki sesi `token` dari `next/headers cookies()` (digunakan oleh aplikasi web).
3. Melakukan verifikasi kriptografis tanda tangan token. Mengembalikan `JWTPayload` jika sah, atau `null` jika tidak valid / kedaluwarsa.

### 13.3. Penegakan Otorisasi (RBAC)
- **Tingkat Publik**: Endpoint menu, artikel, lookup barcode, registrasi, login, dan kalkulasi instan.
- **Tingkat Anggota (`role === "user"` atau `"admin"`)**: Akses profil, penyimpanan riwayat perhitungan, penyimpanan riwayat scan makanan, upload media pribadi, konsultasi FitBot.
- **Tingkat Administrator (`role === "admin"`)**: Seluruh operasi penulisan/pembaruan/penghapusan katalog menu, artikel, lokasi olahraga, moderasi akun pengguna di `/api/accounts`, dan katalog master scan makanan di `/api/admin/master-makanan`.

---

## 14. State Management and Data Flow

### 14.1. Manajemen State di Sisi Klien
- **Tanpa Pustaka Global State Tambahan**: Tidak mengadopsi Redux, Zustand, atau Jotai.
- **React Hooks Standar**: Menggunakan `useState`, `useEffect`, `useCallback`, dan `useRef` di setiap komponen halaman.
- **Konteks Global (React Context)**: `ChatContextProvider` membungkus layout klien untuk memelihara riwayat chat dan status jendela percakapan FitBot.
- **Event Bus Kustom**: Menggunakan event browser kustom `window.dispatchEvent(new CustomEvent("profile:updated"))` untuk menyinkronkan foto profil terbaru dari halaman `/profile` ke komponen `NavProfile` di navbar tanpa memicu refresh halaman.

### 14.2. Pola Aliran Data
- Seluruh pengambilan data di halaman klien (`"use client"`) menggunakan fungsi asynchronous `fetch()` menuju Next.js Route Handlers (`/api/*`).
- Formulir dan aksi dilengkapi dengan *optimistic UI feedback* dan *loading state* (menggunakan ikon animasi `Loader2`).

---

## 15. Important Business Rules

### 15.1. Formula Perhitungan Kesehatan (`lib/kesehatan.ts`)

| Parameter | Rumus / Logika Perhitungan | Acuan Ilmiah |
|---|---|---|
| **Indeks Massa Tubuh (BMI)** | $\text{BMI} = \frac{\text{Berat Badan (kg)}}{(\text{Tinggi Badan (m)})^2}$ | Standar WHO |
| **Kategori Status BMI** | • Kurus: $\text{BMI} < 18.5$<br>• Normal: $18.5 \le \text{BMI} < 25.0$<br>• Berlebih: $25.0 \le \text{BMI} < 30.0$<br>• Obesitas: $\text{BMI} \ge 30.0$ | Perbandingan floating-point presisi $\epsilon = 10^{-6}$ untuk batas nilai aman. |
| **BMR Pria** | $\text{BMR} = 10 \times \text{BB} + 6.25 \times \text{TB} - 5 \times \text{Usia} + 5$ | Persamaan Mifflin-St Jeor |
| **BMR Wanita** | $\text{BMR} = 10 \times \text{BB} + 6.25 \times \text{TB} - 5 \times \text{Usia} - 161$ | Persamaan Mifflin-St Jeor |
| **TDEE (Kalori Harian)** | $\text{TDEE} = \text{BMR} \times \text{Faktor Aktivitas}$ | • Sedentary/Rebahan: 1.2<br>• Light/Ringan: 1.375<br>• Moderate/Sedang: 1.55<br>• Active/Berat: 1.725 |
| **Rentang Berat Ideal** | $[18.5 \times \text{TB(m)}^2, 24.9 \times \text{TB(m)}^2]$ | Batas aman BMI normal |
| **Kebutuhan Protein** | $\text{Protein} = \text{BB (kg)} \times 1.4\text{ gram/hari}$ | Angka kecukupan aktif |
| **Kebutuhan Lemak** | $\text{Lemak} = \frac{\text{TDEE} \times 0.30}{9}\text{ gram/hari}$ | 30% dari total kalori harian |
| **Kebutuhan Karbohidrat** | $\text{Karbohidrat} = \frac{\text{TDEE} - (\text{Protein} \times 4) - (\text{Lemak} \times 9)}{4}\text{ gram/hari}$ | Dihitung dari sisa kalori |

### 15.2. Pemetaan Kategori Latihan Berdasarkan Status BMI

| Status BMI | Kategori Fasilitas | Rekomendasi Jenis Olahraga |
|---|---|---|
| **Kurus** | `gym` | Latihan beban terarah (*hypertrophy / strength training*) untuk meningkatkan massa otot. |
| **Normal** | `lapangan` | Olahraga fungsional dan permainan komunitas (futsal, badminton, lari, basket). |
| **Berlebih** | `low_impact` | Kardio berbenturan rendah untuk membakar kalori tanpa membebani persendian kaki. |
| **Obesitas** | `low_impact` | Berenang, jalan santai, senam air untuk menjaga integritas sendi lutut. |

### 15.3. Aturan Validasi Barcode Makanan
- Barcode wajib berupa untaian angka numerik dengan panjang antara 3 hingga 64 digit (`/^\d{3,64}$/`).
- Nilai gizi (Kalori, Protein, Lemak, Karbohidrat, Gula) dinormalisasi per 100 gram produk.

---

## 16. Dependencies and External Services

### 16.1. Dependensi Produksi Utama (`package.json`)

| Paket | Versi | Peran dalam Aplikasi |
|---|---|---|
| `next` | 16.1.6 | Kerangka kerja aplikasi React berbasis App Router |
| `react` / `react-dom` | 19.2.3 | Pustaka antarmuka pengguna inti |
| `@prisma/client` | ^7.4.2 | ORM database client |
| `@prisma/adapter-pg` | ^7.4.2 | Adaptor koneksi PostgreSQL untuk Prisma 7 |
| `pg` | ^8.19.0 | Klien driver PostgreSQL Node.js |
| `ioredis` | ^6.0.0 | Klien performa tinggi untuk Redis caching |
| `jose` | ^6.2.1 | Implementasi JWT standar Web Crypto API |
| `bcryptjs` | ^3.0.3 | Pustaka hashing kata sandi akun |
| `zod` | ^4.3.6 | Validasi skema tipe data dan formulir |
| `cloudinary` | ^2.9.0 | SDK pengunggahan dan manipulasi gambar Cloudinary |
| `@react-oauth/google` | ^0.13.4 | Komponen tombol integrasi Google Sign-In |
| `google-auth-library` | ^10.6.1 | Verifikasi token ID Google OAuth sisi server |
| `leaflet` / `react-leaflet` | ^1.9.4 / ^5.0.0 | Rendering peta digital interaktif |
| `@tiptap/*` (9 paket) | ^3.22.3 | Editor teks kaya WYSIWYG untuk konten artikel |
| `framer-motion` | ^12.34.3 | Pustaka animasi transisi antarmuka |
| `sonner` | ^2.0.7 | Pustaka notifikasi toast |
| `next-themes` | ^0.4.6 | Manajemen preferensi tema terang/gelap |
| `lucide-react` | ^0.576.0 | Koleksi ikon antarmuka |
| `jspdf` / `jspdf-autotable` | ^4.2.1 / ^5.0.8 | Pustaka pembuatan berkas laporan PDF |
| `html2canvas` | ^1.4.1 | Pustaka konversi elemen HTML menjadi canvas |

### 16.2. Variabel Lingkungan (`.env` & `.env.example`)

| Nama Variabel Lingkungan | Status Kebutuhan | Deskripsi & Contoh |
|---|---|---|
| `DATABASE_URL` | **Wajib** | URL koneksi PostgreSQL (contoh: `postgresql://user:pass@ep-host.neon.tech/fitlife`) |
| `JWT_SECRET` | **Wajib** | Kunci rahasia acak untuk menandatangani token JWT |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | **Wajib untuk Google Auth** | Kunci Client ID Google OAuth Web |
| `CLOUDINARY_CLOUD_NAME` | **Wajib untuk Media** | Nama cloud instance Cloudinary |
| `CLOUDINARY_API_KEY` | **Wajib untuk Media** | API key publik Cloudinary |
| `CLOUDINARY_API_SECRET` | **Wajib untuk Media** | API key rahasia Cloudinary |
| `GROQ_API_KEY` | **Wajib untuk FitBot** | Kunci otentikasi API Groq Cloud |
| `REDIS_URL` | Opsional (Sangat Dianjurkan) | URL koneksi Redis Upstash / Redis Server |
| `FOOD_CACHE_TTL` | Opsional | Durasi cache produk makanan (default: 604800 detik / 7 hari) |

---

## 17. Platform / Environment Requirements

- **Lingkungan Eksekusi**: Node.js 18.x atau 20.x ke atas.
- **Basis Data Utama**: PostgreSQL 14+ (direkomendasikan serverless seperti Neon DB).
- **In-Memory Cache**: Redis server 6+ atau Upstash Redis (aplikasi tetap berjalan dengan fallback peringatan log jika Redis tidak aktif).
- **Konfigurasi Domain Gambar (`next.config.ts`)**:
  - `res.cloudinary.com`
  - `lh3.googleusercontent.com`
  - `images.unsplash.com`
  - `images.openfoodfacts.org`
  - `static.openfoodfacts.org`

---

## 18. Current Limitations or Known Issues

| # | Keterbatasan / Isu Dikenal | Tingkat Dampak | Rincian Temuan dari Kode Sumber |
|---|---|---|---|
| 1 | **Tidak Adanya Global Next.js Middleware** | Menengah | Belum terdapat file `middleware.ts` terpusat di root proyek. Validasi sesi dan hak akses admin ditegakkan secara independen di setiap Route Handler dan komponen layout. |
| 2 | **Data Fetching Dominan di Sisi Klien** | Ringan–Menengah | Sebagian besar halaman menggunakan `"use client"` dengan pemanggilan `fetch()` dalam `useEffect`. Pendekatan ini belum memanfaatkan streaming data React Server Components secara penuh. |
| 3 | **Belum Tersedia Layanan Email Transaksional** | Ringan | Akun langsung aktif setelah registrasi tanpa proses verifikasi email OTP/link aktivasi, dan belum tersedia alur *Lupa Kata Sandi* via email. |
| 4 | **Siklus Hidup Peta Leaflet pada Fast Reload** | Ringan | Pustaka Leaflet memerlukan penanganan pembersihan wadah DOM yang teliti saat Turbopack melakukan fast-reload dinamis agar tidak terjadi kesalahan `_leaflet_pos is undefined`. |
| 5 | **Fitur Scan Barcode Web Menggunakan Input Manual** | Ringan | Pemindaian kamera real-time barcode secara native difokuskan pada aplikasi mobile Flutter; halaman web menyediakan input angka barcode manual dan riwayat hasil scan. |

---

## 19. Important Technical Constraints

1. **Prisma Output Generator**: Prisma client di-generate ke `@/generated/prisma`. Mengimpor langsung dari `@prisma/client` tanpa konfigurasi akan menghasilkan error model tidak ditemukan.
2. **Presisi Komparasi Floating-Point**: Klasifikasi batas angka BMI menggunakan epsilon rounding `1e-6` guna mencegah anomali biner IEEE-754 pada angka desimal presisi (misal `18.499999999999996`).
3. **Batas Ukuran Berkas Unggahan**:
   - Foto avatar profil: Maksimal 2MB (jpg, png, webp).
   - Gambar resep menu: Maksimal 3MB.
   - Foto produk barcode: Maksimal 5MB.
4. **Pembatasan Pemakaian Token LLM Groq**:
   - Model dikunci pada `qwen/qwen3.8-27b`.
   - Panjang sliding window riwayat chat dibatasi maksimal 4 pesan terakhir.
   - Parameter `max_tokens` dibatasi ketat pada 350 token per jawaban.
5. **Kunci Cache Barcode Standar**: Seluruh kunci cache Redis produk makanan berformat seragam `food:barcode:<barcode>` untuk mempermudah invalidasi silang antara modul user dan admin.

---

## 20. Feature-to-Page / Component Mapping

| Fitur Aplikasi | Halaman Client | Halaman Admin | Rute API | Berkas Inti / Utilitas |
|---|---|---|---|---|
| **Kalkulator BMI & Kalori** | `/kalkulator` | — | `/api/perhitungan` | `lib/kesehatan.ts`, `LokasiMap.tsx` |
| **Grafik Riwayat BMI** | `/kalkulator` | — | `/api/perhitungan` (GET) | `components/BMIRiwayatChart.tsx` |
| **Katalog Resep Menu** | `/menu`, `/menu/[slug]` | `/admin/menu/*` | `/api/menus/*`, `/api/upload/menu` | `prisma/models/menu.prisma` |
| **Artikel Edukasi Kesehatan** | `/artikel`, `/artikel/[slug]` | `/admin/artikel/*` | `/api/artikels/*` | `RichTextEditor.tsx`, `artikel.prisma` |
| **Peta Fasilitas Olahraga** | `/lokasi` | `/admin/lokasi/*` | `/api/lokasi-olahraga/*` | `LokasiMap.tsx`, `LokasiPickerMap.tsx` |
| **Pencarian Barcode Makanan** | `/scan-makanan` | — | `/api/scan-makanan/lookup` | `lib/redis.ts`, `lib/openfoodfacts.ts` |
| **Riwayat Scan Makanan** | `/scan-makanan` | — | `/api/scan-makanan/*` | `prisma/models/scanMakanan.prisma` |
| **Master Scan Makanan** | — | `/admin/master-makanan` | `/api/admin/master-makanan/*` | `prisma/models/masterMakanan.prisma` |
| **Asisten FitBot AI** | Floating `ChatButton` | — | `/api/chat` | `app/api/chat/route.ts` |
| **Autentikasi & Akun** | `/login`, `/register` | `/admin/pengguna` | `/api/auth/*`, `/api/accounts/*` | `lib/auth.ts`, `prisma/models/account.prisma` |
| **Profil Pengguna** | `/profile` | `/admin/profile` | `/api/profile/*` | `NavProfile.tsx`, `app/api/profile/*` |
| **Dasbor Analitik Admin** | — | `/admin/dashboard` | `/api/admin/dashboard` | `app/api/admin/dashboard/route.ts` |
| **Sistem Tema UI** | Seluruh Halaman | Seluruh Halaman | — | `app/globals.css`, `ThemeProvider.tsx` |

---

## 21. Acceptance Criteria for Existing Major Features

### 21.1. Kalkulator Kesehatan (`/kalkulator`)
- [x] Mendukung input gender, tinggi (cm), berat (kg), usia (tahun), dan 4 tingkat aktivitas.
- [x] Nilai BMI dihitung dengan rumus $\text{BB} / \text{TB(m)}^2$ dan dikelompokkan ke dalam 4 kategori status WHO.
- [x] Nilai BMR dihitung dengan persamaan Mifflin-St Jeor dengan pembedaan gender pria dan wanita.
- [x] Nilai TDEE dihitung dengan mengalikan BMR terhadap faktor aktivitas (1.2, 1.375, 1.55, 1.725).
- [x] Rentang berat ideal dihitung berdasarkan batas normal BMI $[18.5 \times \text{TB}^2, 24.9 \times \text{TB}^2]$.
- [x] Rekomendasi makronutrien (protein, lemak, karbohidrat) ditampilkan secara presisi.
- [x] Hasil kalkulasi ditampilkan secara instan di sisi klien sebelum formulir dikirim.
- [x] Pengguna yang telah masuk dapat menyimpan hasil kalkulasi ke database dan melihat grafik riwayat 10 data terakhir.
- [x] Menampilkan rekomendasi menu dan fasilitas olahraga terdekat sesuai status BMI yang dihasilkan.

### 21.2. Master Scan Makanan Admin (`/admin/master-makanan`)
- [x] Menampilkan kartu ringkasan statistik (Total Produk, Terverifikasi, Komunitas, Database OpenFoodFacts, Total Frekuensi Scan).
- [x] Menyediakan toolbar filter berdasarkan sumber produk (*Semua*, *Terverifikasi*, *Komunitas*, *Open Food Facts*).
- [x] Menyediakan kolom pencarian teks dengan debounce 400ms untuk barcode, nama makanan, dan brand.
- [x] Mendukung aksi *Verifikasi Cepat* untuk mengubah status produk komunitas menjadi `verified` sekali klik.
- [x] Menyediakan modal penyuntingan informasi produk dan penyesuaian gramatur nutrisi (Kalori, Protein, Lemak, Karbohidrat, Gula).
- [x] Mendukung penambahan produk master baru dengan pengunggahan foto ke Cloudinary.
- [x] Mendukung penghapusan produk dengan pembersihan data database dan pemusnahan kunci cache Redis terkait.

### 21.3. 3-Tier Barcode Scan Makanan (`/api/scan-makanan/lookup`)
- [x] Memvalidasi parameter barcode berupa 3 sampai 64 digit angka.
- [x] Tier 1: Mengembalikan data seketika dengan header `X-Cache: HIT` jika data ditemukan di Redis.
- [x] Tier 2: Mengambil dari tabel `master_makanan` pada saat cache miss, memperbarui Redis, dan menambah counter `scan_count`.
- [x] Tier 3: Menghubungi Open Food Facts API jika data tidak ada di DB lokal, lalu melakukan auto-upsert ke database dan Redis.
- [x] Pengguna terdaftar dapat menyimpan produk hasil pencarian ke riwayat pemindaian akun pribadi melalui `/api/scan-makanan/save`.

### 21.4. Asisten Konsultasi FitBot AI (`/api/chat`)
- [x] Membatasi akses percakapan hanya untuk pengguna yang telah terautentikasi.
- [x] Menangani 3 shortcut lokal ("cek tinggi & berat badan", "status bmi terakhir", "hitung kalori harian") dengan 0 token LLM.
- [x] Menginjeksi ringkasan profil fisik pengguna terkini ke dalam system prompt ringkas (~80 token).
- [x] Membatasi riwayat percakapan yang dikirim ke LLM maksimal 4 pesan terakhir.
- [x] Menerapkan mekanisme retry exponential backoff maksimal 3 kali (2s, 4s, 8s) saat menghadapi error 429 atau 503 dari Groq.
- [x] Membatasi topik obrolan secara ketat hanya pada ranah kesehatan, olahraga, dan nutrisi makanan.

### 21.5. Otentikasi & Akun Pengguna
- [x] Pendaftaran akun dengan validasi Zod (nama min 2 karakter, email valid, password min 8 karakter berisi kombinasi huruf & angka).
- [x] Masuk menggunakan kredensial email & password dengan verifikasi hash `bcryptjs`.
- [x] Masuk menggunakan Google OAuth baik dari Web (`access_token`) maupun Mobile (`id_token`).
- [x] Menerbitkan token JWT dengan masa aktif 7 hari yang disimpan dalam cookie HTTP-only aman.
- [x] Mendukung pembacaan token autentikasi dari header `Authorization: Bearer <token>` untuk klien mobile.
- [x] Pembaruan profil fisik (tinggi, berat badan, tanggal lahir) dan unggah avatar ke Cloudinary.
- [x] Penghapusan akun pengguna memicu cascade deletion pada riwayat perhitungan, lokasi, dan riwayat scan.

---

> **Catatan Verifikasi Dokumen**:
> - Dokumen PRD ini diperbarui berdasarkan inspeksi komprehensif pada branch aktif `calc-bmi` commit `bffabca`.
> - Seluruh 74 pengujian unit dan integrasi (`vitest --run`) terkonfirmasi lulus (100% pass).
> - Seluruh pemetaan rute, komponen antarmuka, model Prisma multi-file, dan alur bisnis telah diverifikasi langsung terhadap implementasi kode aktual.
