# Product Requirement Document (PRD) — FitLife

> **Status:** Active / Source of Truth  
> **Last Updated:** 2026-10-01  
> **Repository:** `proyek_3` (FitLife Web & Mobile REST API Service)  
> **Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma ORM, PostgreSQL

---

## 1. Product Overview

**FitLife** (`FitLife.id`) adalah platform kesehatan, kebugaran, dan manajemen nutrisi berbasis web interaktif sekaligus backend REST API untuk integrasi aplikasi mobile (Flutter). Platform ini dirancang untuk membantu pengguna menghitung metrik kesehatan tubuh secara presisi (BMI, BMR, TDEE, estimasi makronutrisi harian), menemukan menu makanan sehat yang disesuaikan dengan status gizi, membaca artikel edukasi kesehatan, mengeksplorasi lokasi fasilitas olahraga/taman terdekat pada peta interaktif yang disesuaikan dengan profil BMI, mengekspor laporan riwayat kebugaran (PDF & PNG), memantau riwayat pemindaian barcode makanan kemasan terintegrasi Open Food Facts, serta berkonsultasi seputar pola hidup sehat melalui pusat asisten AI terintegrasi (**FitBot Hub**).

---

## 2. Product Goals

1. **Akurasi & Personalisasi Metrik Kesehatan:** Menyediakan kalkulator kesehatan komprehensif menggunakan standar Mifflin-St Jeor dan rekomendasi makronutrisi, menyimpan riwayat fluktuasi berat badan pengguna ke database, serta menyediakan visualisasi tren dan ekspor laporan digital.
2. **Panduan Nutrisi & Rekomendasi Menu:** Menyajikan katalog resep makanan sehat yang dapat difilter berdasarkan status gizi (*Kurus, Normal, Berlebih, Obesitas*) lengkap dengan informasi kalori dan durasi memasak.
3. **Pencatatan Nutrisi Makanan Kemasan:** Mendukung ekosistem barcode scanner Open Food Facts untuk mengecek kalori, protein, lemak, karbohidrat, dan gula dari produk makanan serta menyimpan riwayatnya.
4. **Eksplorasi Fasilitas Olahraga Berbasis Kategori Status Gizi:** Membantu pengguna menemukan lokasi gym, lapangan komunitas, atau fasilitas low-impact terdekat menggunakan peta interaktif berbasis koordinat geografis yang terhubung langsung dengan rekomendasi hasil kalkulasi BMI.
5. **Edukasi & Asistensi Interaktif (FitBot AI Hub):** Menyediakan pusat bantuan mandiri modern dengan tab Home, Messages, dan Help (FAQ) yang ditenagai chatbot cerdas (*FitBot*) via Groq API, teroptimasi konsumsi token (TPM/RPM), serta terpersonalisasi dengan profil fisik pengguna dan konteks halaman yang sedang diakses.
6. **Ekspor & Dokumentasi Progres Kebugaran:** Memberikan fasilitas ekspor riwayat BMI ke dokumen PDF formal dan kartu gambar PNG beresolusi tinggi untuk dokumentasi mandiri maupun konsultasi tenaga medis.
7. **Manajemen Konten Terpusat (Admin):** Menyediakan portal administrator untuk mengelola artikel, menu makanan, direktori lokasi olahraga (termasuk penentuan kategori fasilitas), serta status akun pengguna.

---

## 3. Existing Features

Fitur-fitur yang ada diimplementasikan dengan klasifikasi verifikasi berikut:

| Fitur | Status Verifikasi | Deskripsi Singkat |
| :--- | :--- | :--- |
| **Autentikasi & Otorisasi Pengguna** | **Confirmed from code** | Registrasi & Login (Email/Password & Google OAuth), JWT cookie & Bearer token, auto session sync. |
| **Manajemen Profil Pengguna** | **Confirmed from code** | Edit nama, username, kontak, tanggal lahir, BB, TB, foto profil (Cloudinary face-crop), dan ganti kata sandi. |
| **Kalkulator BMI, BMR, TDEE & Makronutrisi** | **Confirmed from code** | Perhitungan formula Mifflin-St Jeor, rentang berat ideal, distribusi protein, lemak, karbohidrat. |
| **Riwayat & Grafik Tren BMI** | **Confirmed from code** | Visualisasi SVG line chart riwayat berat/BMI, badge tren kenaikan/penurunan, dan penghapusan riwayat. |
| **Ekspor Riwayat BMI (PDF & PNG)** | **Confirmed from code** | Ekspor riwayat ke dokumen PDF formal (A4 table) via `jspdf` & `jspdf-autotable`, serta download kartu digital PNG via `html2canvas`. |
| **Rekomendasi Fasilitas Olahraga per Kategori BMI** | **Confirmed from code** | Menampilkan peta interaktif Leaflet di halaman kalkulator dengan fasilitas yang dipetakan berdasarkan status BMI (`gym`, `lapangan`, `low_impact`) dan disortir berdasarkan jarak terdekat. |
| **Katalog Menu Makanan Sehat** | **Confirmed from code** | Filter status target gizi, pencarian teks, detail resep & kalori, penghitung jumlah pembaca (*reader counter*). |
| **Direktori Artikel Edukasi Kesehatan** | **Confirmed from code** | Highlight artikel unggulan (*featured*), filter kategori, pagination, estimasi durasi baca, increment views. |
| **Peta Lokasi Olahraga (Leaflet)** | **Confirmed from code** | Peta interaktif Leaflet.js, geolokasi pengguna, filter pencarian & kategori (`gym`, `lapangan`, `low_impact`), pembacaan query `?category=` dan `?target=`, switch mode peta vs daftar. |
| **Riwayat & Integrasi Scan Barcode Makanan** | **Confirmed from code** | Endpoint lookup Open Food Facts, penyimpanan riwayat ke cloud, tampilan riwayat gizi di web, dan panduan scan mobile. |
| **FitBot AI Hub (3-Tab Assistant)** | **Confirmed from code** | Widget kesehatan dengan Bottom Navigation (Home, Messages, Help): ringkasan metrik realtime, context injection per halaman via `ChatContext`, pencarian FAQ accordion, chat dengan Groq API (`qwen/qwen3.8-27b`), zero-token DB shortcuts, lean prompt, dan token optimization (TPM/RPM). |
| **Dashboard Metrik Admin** | **Confirmed from code** | Statistik ringkasan total pengguna, pengguna aktif, total menu, total artikel, serta menu terpopuler & pengguna terbaru. |
| **CRUD Manajemen Konten Admin** | **Confirmed from code** | Modul kelola Pengguna (toggle status aktif/hapus), Menu Sehat, Artikel (Rich Text TipTap), dan Lokasi Olahraga (kategori, alamat, geocoding pin map). |
| **Integrasi Mobile App REST API** | **Confirmed from code** | Endpoint auth, profile, menu, artikel, scan-makanan, lokasi, dan kalkulator mendukung mobile clients via `Authorization: Bearer`. |

---

## 4. Target Users

*(Berdasarkan inferensi dari alur kerja, domain fungsional, dan data model)*

1. **Individu dengan Target Pengelolaan Berat Badan:** Pengguna yang ingin menurunkan, menaikkan, atau mempertahankan berat badan dengan panduan kalori harian, pemantauan grafik berkala, serta dokumen ekspor PDF. *(Inferred)*
2. **Pecinta Makanan Sehat & Pelaku Diet:** Orang yang membutuhkan inspirasi menu makanan sehat dengan batasan kalori terukur dan petunjuk memasak yang jelas. *(Inferred)*
3. **Konsumen Sadar Nutrisi:** Pengguna belanja harian yang ingin memverifikasi kandungan gizi (gula, lemak, protein, kalori) produk kemasan melalui scan barcode. *(Inferred)*
4. **Komunitas Olahraga / Fitness Enthusiast:** Pengguna yang mencari rekomendasi tempat olahraga umum, gym, atau fasilitas low-impact yang sesuai dengan kondisi fisik dan status BMI mereka. *(Inferred)*
5. **Administrator & Content Creator FitLife:** Pengelola konten yang bertanggung jawab memperbarui artikel, resep menu, fasilitas olahraga beserta kategorinya, dan memantau status pengguna. *(Confirmed from code)*

---

## 5. Main User Flows

### 5.1 Alur Perhitungan Metrik Kesehatan, Rekomendasi Olahraga & Ekspor
```mermaid
flowchart TD
    Start([Kunjungi /kalkulator]) --> Input[Input TB, BB, Gender, Usia, Aktivitas]
    Input --> Calc[Hitung BMI, BMR, TDEE & Makro via lib/kesehatan.ts]
    Calc --> Display[Tampilkan Skor BMI, Rekomendasi Menu & Target Status]
    Display --> SportsRec[Petakan TargetStatus ke Kategori Olahraga:\nKurus->gym, Normal->lapangan, Overweight/Obese->low_impact]
    SportsRec --> FetchLoc[Fetch /api/lokasi-olahraga?target=Status]
    FetchLoc --> RenderMap[Render Peta Leaflet & Daftar Lokasi Terdekat di /kalkulator]
    Display --> CheckAuth{Apakah User Login?}
    CheckAuth -->|Ya| SaveDB[POST /api/perhitungan]
    SaveDB --> Transact[Prisma Transaction:\n1. Simpan snapshot ke Perhitungan\n2. Sync BB & TB terkini ke Account]
    Transact --> UpdateChart[Update Grafik Riwayat BMI di Halaman]
    UpdateChart --> ExportOption{Pilihan Ekspor?}
    ExportOption -->|Export PDF| GenPDF[Generate Dokumen Laporan A4 via jsPDF & autoTable]
    ExportOption -->|Export PNG| GenPNG[Capture Kartu Digital via html2canvas]
    CheckAuth -->|Tidak| GuestNote[Tampilkan Hasil Tanpa Menyimpan Riwayat]
    GenPDF --> End([Selesai])
    GenPNG --> End
    GuestNote --> End
```

### 5.2 Alur FitBot — AI Health Hub & Optimasi Token
```mermaid
flowchart TD
    ChatOpen[Klik Floating ChatButton] --> CheckLogin{User Login?}
    CheckLogin -->|Tidak| ShowPrompt[Tampilkan Pesan Login Diperlukan]
    CheckLogin -->|Ya| OpenPanel[Buka FitBot Hub]
    OpenPanel --> SelectTab{Pilih Tab}
    
    SelectTab -->|Tab Home| HomeView[Tampilkan Status Metrik Realtime, Shortcut Cepat, & Link Fitur]
    SelectTab -->|Tab Help| HelpView[Pencarian FAQ Interaktif & Tombol 'Tanyakan ke FitBot']
    SelectTab -->|Tab Messages| ChatView[Tampilkan Obrolan Aktif & Context Badge]
    
    HomeView --> UserMsg[Kirim Pertanyaan / Klik Shortcut Prompt]
    HelpView --> UserMsg
    ChatView --> UserMsg
    
    UserMsg --> CheckShortcut{Pesan Termasuk Zero-Token Shortcut?\n'cek tinggi & berat badan' /\n'status bmi terakhir' /\n'hitung kalori harian'}
    CheckShortcut -->|Ya| FastDB[Ambil Data dari DB / Hitung Rumus Lokal & Return Instan tanpa LLM]
    CheckShortcut -->|Tidak| ApiReq[POST /api/chat dengan Sliding Window 4 Pesan]
    
    ApiReq --> FetchContext[Ambil Profil User & Status BMI Terakhir]
    FetchContext --> BuildPrompt[Susun Lean System Prompt ~80 token]
    BuildPrompt --> GroqCall[Call Groq Cloud API: qwen/qwen3.8-27b\nmax_tokens: 350, temp: 0.2]
    GroqCall --> RetryCheck{Status 429 atau 503?}
    RetryCheck -->|Ya| ExpRetry[Exponential Backoff Retry maks 3x: 2s, 4s, 8s]
    ExpRetry --> GroqCall
    RetryCheck -->|Tidak| GuardCheck{Lolos Guardrail Kesehatan?}
    GuardCheck -->|Ya| HealthAnswer[Berikan Saran Nutrisi / Kalori Personal]
    GuardCheck -->|Di Luar Topik/Coding| Refusal[Penolakan Ramah: Hanya Melayani Topik Kesehatan]
    HealthAnswer --> RenderMarkdown[Render Markdown Respons]
    Refusal --> RenderMarkdown
    FastDB --> RenderMarkdown
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
| `/kalkulator` | Publik / User | `KalkulatorBMIPage`, `BMIRiwayatChart`, `MapView` (Leaflet) | Kalkulator interaktif, grafik tren SVG, ekspor PDF/PNG, rekomendasi menu, dan peta fasilitas olahraga sesuai status BMI. | Confirmed |
| `/menu` | Publik | `MenuPage`, `MenuFilter`, `Pagination` | Direktori resep menu sehat, filter target status gizi, pencarian judul. | Confirmed |
| `/menu/[slug]` | Publik | `MenuDetailPage`, `RecipeInfo` | Detail menu lengkap, kalori, waktu memasak, reader counter. | Confirmed |
| `/artikel` | Publik | `ArtikelPage`, `FeaturedBanner`, `CategoryPills` | Direktori artikel kesehatan, highlight artikel unggulan, durasi baca. | Confirmed |
| `/artikel/[slug]` | Publik | `ArtikelDetailPage`, `TiptapRenderer` | Detail artikel lengkap, counter pembaca, konten HTML/rich text. | Confirmed |
| `/lokasi` | Publik | `LokasiOlahragaPage`, `MapView` (Leaflet) | Peta pencari tempat olahraga, filter kategori (`gym`, `lapangan`, `low_impact`), pembacaan query URL `?category=` / `?target=`, switch peta vs list. | Confirmed |
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
| `/admin/lokasi` | Role Admin | `LokasiAdminPage`, `LokasiTable` | Daftar fasilitas olahraga yang tercatat dalam sistem beserta badge kategorinya. | Confirmed |
| `/admin/lokasi/create` | Role Admin | `CreateLokasiPage`, `LokasiPickerMap` | Tambah lokasi olahraga dengan dropdown kategori (`gym`, `lapangan`, `low_impact`) dan pin koordinat peta. | Confirmed |
| `/admin/lokasi/[id]/edit` | Role Admin | `EditLokasiPage`, `LokasiPickerMap` | Edit nama tempat, kategori, alamat, dan pin koordinat tempat olahraga. | Confirmed |
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

    Root --> FloatingHub["Floating FitBot Launcher (ChatButton)"]
    FloatingHub --> FHome["Tab Home: Health Hub & Metrics"]
    FloatingHub --> FMsg["Tab Messages: Active Chat & Reset"]
    FloatingHub --> FHelp["Tab Help: Searchable FAQ Accordion"]
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

### 8.2 Integrasi Rekomendasi Olahraga Berbasis Kategori Status BMI
- **Kategori Fasilitas Olahraga:**
  - `gym`: Fitness center, angkat beban, mesin beban (direkomendasikan untuk *Kurus / Underweight* untuk pembentukan massa otot).
  - `lapangan`: Lapangan olahraga komunitas, futsal, basket, badminton (direkomendasikan untuk *Normal* guna menjaga stamina kardiovaskular dan kelincahan).
  - `low_impact`: Fasilitas renang, jalur jogging santai, sepeda statis (direkomendasikan untuk *Berlebih* dan *Obesitas* untuk meminimalkan beban benturan sendi lutut).
- **Tampilan Peta Terintegrasi pada Kalkulator:**
  - Komponen Leaflet dinamis (`MapView`) muncul langsung di `/kalkulator` setelah kalkulasi atau saat memilih tab kategori BMI.
  - Menampilkan daftar lokasi terdekat yang diurutkan menggunakan formula jarak Haversine dari koordinat geolokasi pengguna.
  - Tombol tautan langsung `"Eksplor Peta Lengkap →"` menuju `/lokasi?target={status}`.

### 8.3 Ekspor Riwayat BMI (PDF & PNG)
- **Ekspor Dokumen PDF (`jspdf` & `jspdf-autotable`):**
  - Orientasi portrait A4 dengan margin 14mm.
  - Header banner bertema FitLife `#0f1714` dengan aksen hijau dan metadata tanggal cetak.
  - Tabel riwayat text-based yang rapi: Tanggal, Berat (kg), Tinggi (cm), Skor BMI, Kategori Status, BMR, dan TDEE.
  - Kartu statistik ringkasan di bawah tabel: Berat Awal, Berat Terkini, Selisih/Delta Berat, dan Rata-rata Skor BMI.
  - Footer medis penafian tanggung jawab (*disclaimer*).
- **Ekspor Gambar PNG (`html2canvas`):**
  - Merender komponen DOM tersembunyi `KartuRiwayatDigital` dengan rasio `scale: 2` untuk hasil visual tajam.
  - Menyertakan judul, rentang tanggal, tabel rekaman, dan kartu ringkasan berat/BMI.

### 8.4 FitBot AI Assistant & Health Hub (`components/ChatPanel.tsx` & `app/api/chat/route.ts`)
- **Penyedia AI:** Groq Cloud API dengan model `qwen/qwen3.8-27b`.
- **Struktur Antarmuka 3-Tab:**
  1. **Tab Home:** Sapaan pengguna, kartu status obrolan terkini, kartu metrik kesehatan realtime (menampilkan skor BMI terkini & TB/BB dari database), tombol konsultasi langsung, pintasan cepat kontekstual, dan navigasi fitur FitLife.
  2. **Tab Messages:** Obrolan aktif dengan parser Markdown khusus, header dengan indikator halaman aktif (`ChatPageContext`), tombol Reset/Hapus obrolan, error retry button, chip quick prompts, dan disclaimer medis.
  3. **Tab Help:** Direktori FAQ interaktif dengan kolom pencarian instan dan accordion expandable (topik: BMI, BMR vs TDEE, defisit kalori, protein harian, olahraga low-impact, scan makanan) dilengkapi tombol aksi "Tanyakan ke FitBot".
- **Arsitektur Konteks Global (`ChatContext.tsx` & `useSetChatContext.ts`):**
  - Masing-masing halaman client dapat mendaftarkan `pageName`, `quickPrompts`, dan `systemHint` khusus ke FitBot widget.
  - Sinkronisasi otomatis berbasis rute di `ChatButton.tsx` (`PAGE_NAMES` & `PAGE_QUICK_PROMPTS`).
- **Optimasi Token & Kinerja (TPM & RPM):**
  - **Zero-Token Shortcuts:** Deteksi frasa kunci (`cek tinggi & berat badan`, `status bmi terakhir`, `hitung kalori harian`) yang langsung dijawab dari database atau kalkulasi lokal tanpa memanggil LLM.
  - **Lean System Prompt:** System prompt dipangkas menjadi ~80 token dengan injeksi data fisik esensial (Nama, TB, BB, skor BMI terkini).
  - **Sliding Window:** Riwayat percakapan yang dikirim ke LLM dibatasi hanya 4 pesan terakhir (`slice(-4)`).
  - **Kontrol Inferensi:** `max_tokens: 350`, `temperature: 0.2` untuk jawaban padat dan hemat token.
  - **Exponential Backoff Retry:** 3 kali percobaan (jeda 2s, 4s, 8s) untuk kode status HTTP 429 (*rate limit*) dan 503 (*overloaded*).

### 8.5 Barcode Scanner & Integrasi Open Food Facts
- **Validasi Barcode:** Hanya menerima angka 3 hingga 64 digit (`^\d{3,64}$`).
- **Endpoint Lookup:** `POST /api/scan-makanan/lookup` melakukan fetch ke `https://world.openfoodfacts.org/api/v0/product/{barcode}.json` tanpa menyimpan ke database.
- **Normalisasi Nilai Gizi:** Mengambil nutrisi per 100g (kalori, protein, lemak, karbohidrat, gula).
- **Penyimpanan Selektif:** Pengguna login dapat memilih untuk menyimpan hasil scan ke tabel `scan_makanan` melalui `POST /api/scan-makanan/save`.

### 8.6 Peta Lokasi Olahraga (Leaflet)
- **Komponen Client-side:** Dimuat secara dinamis (`ssr: false`) untuk mencegah error rendering server Leaflet window object.
- **Fitur Interaksi:** Auto-detect posisi browser (`navigator.geolocation`), filter pencarian dengan debounce 400ms, filter kategori (`Semua`, `gym`, `lapangan`, `low_impact`), sinkronisasi query `?category=` dan `?target=`, serta switch mode peta vs daftar.
- **Popup Interaktif:** Menampilkan badge kategori, nama, alamat, kalkulasi jarak dari pengguna, dan tautan navigasi langsung ke Google Maps (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`).
- **Admin Geocoding:** Admin dapat memilih titik koordinat pada peta (`LokasiPickerMap`) yang otomatis mengisi form alamat via reverse geocoding OpenStreetMap Nominatim dan menentukan kategori fasilitas.

---

## 9. Existing UI & Design System

- **Styling Core:** Tailwind CSS v4 dikombinasikan dengan token semantic shadcn UI (`app/globals.css`).
- **Palet Warna Utama (Low-Brightness Green):**
  - `Primary:` Hijau Emerald Lembut (`#00cc66`), Hover: `#00b359` (diperbarui dari neon terang `#00ff7f` untuk kenyamanan visual)
  - `Accent Surface:` `#265140`
  - `Dark Mode Base:` Latar belakang dasar `#031f14`, Latar gelap `#01120b`, Kartu `#062c1e`, Border `#0d422e`, Teks `#f0fff4`, Teks Redup `#8aafa1`
  - `Light Mode Base:` Latar belakang `#f0fdf4`, Kartu `#ffffff`, Teks `#052e16`
- **Tipografi:** Google Font *Inter* (`var(--font-inter)`) yang diterapkan di seluruh aplikasi.
- **Komponen UI:** Radix UI primitives (`dialog`, `dropdown-menu`, `slot`), Lucide React icons, React Icons, Sonner (notifikasi toast).
- **Animasi & Interaktivitas:** `framer-motion`, `motion`, `gsap`, dan utilitas animasi Tailwind `tw-animate-css`.
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
        String category "default: lapangan (gym|lapangan|low_impact)"
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
  - Memiliki kolom `category String @default("lapangan")` untuk membedakan kategori fasilitas (`gym`, `lapangan`, `low_impact`).

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
- `GET /api/lokasi-olahraga` — Publik: daftar lokasi olahraga dengan dukungan query filter `?search=`, `?category=`, dan `?target=` (otomatis memetakan target BMI ke kategori).
- `POST /api/lokasi-olahraga` — Admin: menambah lokasi baru (nama, kategori, alamat, latitude, longitude).
- `GET /api/lokasi-olahraga/[id]` — Detail satu lokasi olahraga.
- `PUT /api/lokasi-olahraga/[id]` — Admin: memperbarui detail lokasi olahraga (nama, kategori, alamat, koordinat).
- `DELETE /api/lokasi-olahraga/[id]` — Admin: menghapus fasilitas lokasi olahraga.

### 12.8 Asisten AI & Dashboard Admin
- `POST /api/chat` — Auth: konsultasi kesehatan FitBot dengan Groq API, zero-token DB shortcuts, sliding window history, lean prompt, dan backoff retry.
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
  - Halaman publik memanfaatkan SSR untuk metadata, kemudian client components (`"use client"`) menangani interaktivitas (kalkulator, peta Leaflet, filter, scanner, FitBot hub).
- **Global Chat Context:** `ChatContextProvider` di root layout menyediakan state konteks halaman dan quick prompts dinamis untuk FitBot.
- **Manajemen State Lokal:** Menggunakan React hooks standar (`useState`, `useEffect`, `useCallback`, `useTransition`, `useRef`, `useMemo`).
- **Debounced Fetching:** Pencarian pada katalog menu, artikel, dan lokasi menggunakan debounce timer (400ms) untuk menghemat request jaringan.
- **Theme State:** Dikelola oleh `next-themes` (`ThemeProvider`) dengan persistence ke local storage.
- **Form State & Sanitasi:** Validasi input terpusat menggunakan library `zod` (`lib/definition.ts` dan handler API individual).

---

## 15. Important Business Rules

1. **Konsistensi Metrik Fisik Pengguna:** Saat pengguna terotentikasi melakukan perhitungan pada `/kalkulator`, berat dan tinggi badan pada tabel `Account` otomatis disinkronkan ke nilai terbaru secara transaksional (`prisma.$transaction`), sementara snapshot historis tetap tersimpan utuh di `Perhitungan`.
2. **Kesesuaian Target Gizi Menu & Rekomendasi Olahraga:** Setiap menu wajib memiliki klasifikasi `TargetStatus` (`Kurus`, `Normal`, `Berlebih`, `Obesitas`) yang berkorelasi langsung dengan hasil evaluasi status BMI dan rekomendasi kategori olahraga (`gym`, `lapangan`, `low_impact`).
3. **Pembatasan Topik AI (FitBot):** FitBot dilarang keras melayani topik non-kesehatan dan dilarang membuat kode pemrograman apa pun guna menjaga integritas fungsi sebagai asisten kebugaran.
4. **Optimasi Kuota Token AI:** Pesan-pesan informatif dasar (cek data fisik, status BMI terakhir, hitung kalori) diselesaikan langsung di server tanpa mengonsumsi kuota token Groq AI.
5. **Keamanan Barcode Open Food Facts:** Nilai barcode dibatasi strictly numerik 3 hingga 64 digit guna mencegah ancaman path traversal / injection URL ke API pihak ketiga.
6. **Generasi Slug Unik:** Judul artikel dan nama menu otomatis diubah menjadi slug URL huruf kecil bebas karakter khusus dengan suffix unik jika terdeteksi duplikasi.
7. **Inkrementasi Counter Pembaca:** Mengunjungi detail menu (`/menu/[slug]`) atau detail artikel (`/artikel/[slug]`) mengeksekusi operasi `increment: 1` pada kolom `dibaca`.
8. **Pembersihan Data Berantai (Cascade Delete):** Penghapusan data akun `Account` memicu penghapusan berantai pada semua data `Perhitungan`, `ScanMakanan`, dan `LokasiOlahraga` yang berelasi.

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
- **Dokumen & Ekspor:** `jspdf@^4.2.1`, `jspdf-autotable@^5.0.8`, `html2canvas@^1.4.1`.
- **Keamanan & Autentikasi:** `jose@6.2.1`, `bcryptjs@3.0.3`, `google-auth-library@10.6.1`, `@react-oauth/google@0.13.4`.
- **UI & Styling:** `tailwindcss@4`, `@tailwindcss/typography`, `tw-animate-css`, `radix-ui`, `lucide-react`, `react-icons`, `sonner`, `next-themes`.
- **Animasi & Rich Media:** `framer-motion`, `motion`, `gsap`, `@tiptap/react`, `leaflet`, `react-leaflet`, `react-markdown`.
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

1. **Leaflet SSR Incompatibility:** Library peta Leaflet tidak dapat dirender di sisi server (Node.js) sehingga seluruh komponen peta (`LokasiMap`, `LokasiPickerMap`) wajib dimuat secara asinkronus menggunakan `next/dynamic` dengan opsi `{ ssr: false }`.
2. **Ketergantungan Ketersediaan Data Barcode:** Akurasi pencarian produk makanan kemasan bergantung penuh pada ketersediaan data di repositori publik Open Food Facts. Produk lokal tertentu mungkin belum terdaftar.
3. **Penyimpanan Gambar Artikel:** Konten artikel saat ini mendukung rich text TipTap, tetapi upload gambar inline artikel masih memerlukan URL publik eksternal.
4. **Token Refresh:** Sistem saat ini menggunakan single JWT 7 hari tanpa refresh token rotation berjangka pendek.

---

## 19. Important Technical Constraints

1. **Dual Schema Architecture:** Model Prisma dipisah menjadi modul-modul individual di `prisma/models/*.prisma` dan dikonsolidasikan saat proses generator client berjalan.
2. **Konfigurasi Domain Gambar Eksternal:** Seluruh sumber gambar eksternal wajib didaftarkan di `next.config.ts` (`images.remotePatterns`): `lh3.googleusercontent.com`, `images.unsplash.com`, `res.cloudinary.com`, `images.openfoodfacts.org`, dan `static.openfoodfacts.org`.
3. **CORS untuk Klien Mobile:** Next.js middleware / proxy menangani request `OPTIONS` dan memasang header CORS pada semua rute `/api/*` untuk memastikan kelancaran komunikasi dari aplikasi Flutter di Android/iOS.
4. **Pembatasan Ukuran PDF & Canvas:** Ekspor canvas gambar dibatasi pada node yang ditentukan (`KartuRiwayatDigital`) untuk menjaga performa memori browser.

---

## 20. Feature to Page / Component Mapping

| Fitur | Halaman Utama | Komponen UI | API Handler Terkait | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Login & Registrasi** | `/login`, `/register` | `LoginClient`, `RegisterPage`, `GoogleAuthButton` | `/api/auth/login`, `/api/auth/register`, `/api/auth/google` | Confirmed |
| **Kalkulator BMI & Makro** | `/kalkulator` | `KalkulatorBMIPage`, `BMIRiwayatChart`, `MapView` | `/api/perhitungan`, `/api/lokasi-olahraga` | Confirmed |
| **Ekspor Laporan PDF/PNG** | `/kalkulator` | `BMIRiwayatChart` (actions export) | N/A (Client-side generation via jsPDF & html2canvas) | Confirmed |
| **Katalog Menu Sehat** | `/menu`, `/menu/[slug]` | `MenuPage`, `MenuDetailPage`, `MenuFilter` | `/api/menus`, `/api/menus/[slug]` | Confirmed |
| **Artikel Edukasi** | `/artikel`, `/artikel/[slug]` | `ArtikelPage`, `ArtikelDetailPage` | `/api/artikels`, `/api/artikels/[slug]` | Confirmed |
| **Peta Lokasi Olahraga** | `/lokasi` | `LokasiOlahragaPage`, `MapView`, `LokasiMap` | `/api/lokasi-olahraga` | Confirmed |
| **Riwayat Scan Barcode** | `/scan-makanan` | `ScanMakananPage`, `AuthenticatedHistory` | `/api/scan-makanan`, `/api/scan-makanan/save` | Confirmed |
| **FitBot AI Health Hub** | Global Floating Widget | `ChatButton`, `ChatPanel`, `ChatContext` | `/api/chat`, `/api/auth/me`, `/api/perhitungan` | Confirmed |
| **Profil Pengguna** | `/profile` | `ProfilePage`, `NavProfile` | `/api/profile`, `/api/profile/upload`, `/api/profile/password` | Confirmed |
| **Admin Dashboard** | `/admin/dashboard` | `DashboardPage`, `StatCard` | `/api/admin/dashboard` | Confirmed |
| **Admin Kelola Pengguna** | `/admin/pengguna` | `PenggunaPage` | `/api/accounts`, `/api/accounts/[id]` | Confirmed |
| **Admin Kelola Menu** | `/admin/menu/*` | `MenuPage`, `CreateMenuPage`, `EditMenuPage` | `/api/menus`, `/api/upload/menu` | Confirmed |
| **Admin Kelola Artikel** | `/admin/artikel/*`| `ArtikelPage`, `CreateArtikelPage`, `RichTextEditor` | `/api/artikels` | Confirmed |
| **Admin Kelola Lokasi** | `/admin/lokasi/*` | `LokasiAdminPage`, `CreateLokasiPage`, `EditLokasiPage`, `LokasiPickerMap` | `/api/lokasi-olahraga`, `/api/lokasi-olahraga/[id]` | Confirmed |

---

## 21. Acceptance Criteria for Major Existing Features

### 21.1 Kalkulator BMI, Rekomendasi Olahraga & Analisis Kesehatan
- **GIVEN** pengguna memasukkan tinggi badan (cm), berat badan (kg), jenis kelamin, usia, dan tingkat aktivitas:
- **WHEN** pengguna menekan tombol hitung:
- **THEN** sistem menghitung nilai BMI, status gizi (*Kurus/Normal/Berlebih/Obesitas*), BMR, TDEE, rentang berat ideal, serta gram protein, lemak, dan karbohidrat.
- **AND** sistem otomatis menampilkan rekomendasi kategori olahraga terkait (`gym` untuk Kurus, `lapangan` untuk Normal, `low_impact` untuk Berlebih/Obesitas), fokus aktivitas yang dianjurkan, serta peta Leaflet interaktif berisi fasilitas terdekat dari posisi pengguna.
- **AND** jika pengguna dalam keadaan login, data tersebut otomatis tersimpan di tabel `perhitungan` dan profil pengguna di tabel `accounts` diperbarui.
- **AND** grafik tren riwayat BMI menampilkan titik data baru secara berurutan.

### 21.2 Ekspor Riwayat BMI (PDF & PNG)
- **GIVEN** pengguna terotentikasi memiliki riwayat perhitungan pada `/kalkulator`:
- **WHEN** pengguna mengklik tombol "Export PDF":
- **THEN** file PDF A4 (`Riwayat-BMI-[timestamp].pdf`) otomatis terunduh berisi header resmi FitLife, tabel text-based seluruh riwayat perhitungan, dan ringkasan tren statistik.
- **WHEN** pengguna mengklik tombol "Export PNG":
- **THEN** file gambar PNG kartu digital riwayat BMI otomatis terunduh dengan skala resolusi tinggi.

### 21.3 FitBot AI Health Hub (3-Tab Assistant)
- **GIVEN** pengguna yang terotentikasi membuka widget FitBot:
- **WHEN** pengguna berada di tab "Home":
- **THEN** sistem menampilkan sapaan personal, status metrik BMI realtime dari database, kartu pesan terakhir, dan shortcut pertanyaan cepat sesuai halaman aktif.
- **WHEN** pengguna berada di tab "Help":
- **THEN** pengguna dapat mencari dan membaca accordion FAQ kesehatan, serta menekan tombol "Tanyakan ke FitBot" untuk mengirimkan pertanyaan langsung.
- **WHEN** pengguna mengirim pertanyaan di tab "Messages":
- **THEN** sistem mengecek apakah pesan cocok dengan shortcut tanpa-token (respon instan), atau meneruskan maksimal 4 percakapan terakhir ke Groq API (`qwen/qwen3.8-27b`) dengan lean prompt.
- **WHEN** pengguna mengklik tombol "Reset":
- **THEN** riwayat percakapan dibersihkan kembali ke pesan sambutan awal dan konteks memory di-reset.
- **WHEN** pengguna belum login:
- **THEN** antarmuka mengarahkan pengguna ke halaman `/login`.

### 21.4 Direktori Lokasi Olahraga & Filter Kategori
- **GIVEN** pengguna mengakses halaman `/lokasi` (baik langsung maupun dengan parameter `?category=` atau `?target=`):
- **WHEN** URL memiliki parameter target (misal: `?target=Kurus`):
- **THEN** filter kategori otomatis terpilih sesuai pemetaan (`gym`) dan daftar lokasi olahraga serta pin peta langsung tersaring.
- **WHEN** pengguna mengklik marker pada peta Leaflet:
- **THEN** popup menampilkan badge kategori, nama, alamat, jarak terhitung dari lokasi pengguna, dan tautan pembuka rute di Google Maps.

### 21.5 Pemindaian & Pencarian Barcode Produk Makanan
- **GIVEN** client mengirim nomor barcode produk yang valid (3–64 digit numerik):
- **WHEN** request dikirim ke `POST /api/scan-makanan/lookup`:
- **THEN** sistem menghubungi Open Food Facts dan mengembalikan nama produk, merk, gambar, kalori, protein, lemak, karbohidrat, dan gula per 100g.
- **AND** jika produk tidak ditemukan, sistem mengembalikan status HTTP 404 dengan pesan deskriptif.
- **WHEN** pengguna terotentikasi memilih untuk menyimpan hasil scan:
- **THEN** request `POST /api/scan-makanan/save` menyimpan rekaman ke tabel `scan_makanan` dan entri langsung dapat dilihat di `/scan-makanan`.

### 21.6 Direktori Menu Sehat & Filter Status
- **GIVEN** pengunjung membuka halaman `/menu`:
- **WHEN** memilih salah satu filter status gizi (misal: *Berlebih*):
- **THEN** daftar menu terfilter hanya menampilkan hidangan dengan `target_status` bernilai *Berlebih*.
- **WHEN** pengunjung mengklik kartu menu untuk melihat detail:
- **THEN** halaman `/menu/[slug]` menampilkan rincian kalori, waktu memasak, dan deskripsi resep, serta counter `dibaca` bertambah 1.

---

## 22. Status Assessed: Confirmed, Inferred & Unknown

| Domain / Komponen | Status | Catatan Validasi |
| :--- | :--- | :--- |
| **Arsitektur Next.js & Route Handlers** | **Confirmed from code** | Terverifikasi di `app/` dan `app/api/*`. |
| **Model Data & PostgreSQL Prisma** | **Confirmed from code** | Terverifikasi di `prisma/models/*.prisma` termasuk `LokasiOlahraga.category`. |
| **Formula Perhitungan Kesehatan** | **Confirmed from code** | Terverifikasi di `lib/kesehatan.ts` (Mifflin-St Jeor, faktor aktivitas, makro). |
| **FitBot AI Hub 3-Tab & Optimasi Token** | **Confirmed from code** | Terverifikasi di `components/ChatPanel.tsx`, `ChatButton.tsx`, `ChatContext.tsx`, dan `app/api/chat/route.ts`. |
| **Rekomendasi Olahraga Berbasis BMI** | **Confirmed from code** | Terverifikasi di `app/(client)/kalkulator/page.tsx` dan `app/(client)/lokasi/page.tsx`. |
| **Ekspor Riwayat BMI (PDF & PNG)** | **Confirmed from code** | Terverifikasi di `components/client/BMIRiwayatChart.tsx` via `jspdf`, `jspdf-autotable`, `html2canvas`. |
| **Integrasi Open Food Facts** | **Confirmed from code** | Terverifikasi di `app/api/scan-makanan/lookup/route.ts`. |
| **Integrasi Cloudinary Upload** | **Confirmed from code** | Terverifikasi di `app/api/profile/upload` dan `app/api/upload/menu`. |
| **Target Pengguna & Persona Spesifik** | **Inferred** | Disimpulkan dari karakteristik fitur (pelaku diet, fitness enthusiast, pembaca kesehatan). |
| **Source Code Aplikasi Mobile Flutter** | **Inferred (Terpisah)** | Spesifikasi REST API & Dio client terdokumentasi di repositori, namun source code aplikasi native Flutter dikelola di luar repositori Next.js ini. |
| **Rencana Monetisasi / Langganan Premium** | **Unknown / Needs Clarification** | Belum terdapat skema pembayaran, subscription model, atau paywall pada kode saat ini. |
