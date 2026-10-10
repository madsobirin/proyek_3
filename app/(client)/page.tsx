import Link from "next/link";
import {
  Scale,
  Utensils,
  ScanBarcode,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Flame,
  Activity,
  HeartPulse,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import HomeRecentContent from "@/components/HomeRecentContent";

export default function Home() {
  return (
    <>
      {/* ── 1. Hero Section (Health & Wellness Theme) ── */}
      <section className="relative bg-background-base pt-10 pb-16 lg:pt-20 lg:pb-28 overflow-hidden border-b border-card-border/60">
        {/* Subtle organic ambient glow (natural emerald leaf, zero harsh radioactive glare) */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Column: Value Proposition */}
            <div className="w-full lg:w-7/12 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-card-border text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide mb-6">
                <HeartPulse size={14} className="text-primary" />
                <span>Panduan Gizi & Gaya Hidup Berkelanjutan</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-light leading-[1.15] mb-6">
                Kendalikan Pola Makan,{" "}
                <span className="text-primary font-black">
                  Capai Berat Badan Ideal.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-text-muted mb-8 leading-relaxed max-w-xl">
                FitLife.id memadukan kalkulator komposisi tubuh ilmiah, katalog
                resep bernutrisi dengan estimasi biaya, dan pemindai barcode gizi
                untuk menemani setiap langkah sehat Anda.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 justify-start mb-10">
                <Link
                  href="/kalkulator"
                  className="bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-3.5 rounded-xl font-bold transition shadow-sm hover:shadow-emerald-900/20 text-center flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Scale size={18} />
                  <span>Hitung BMI & Kalori</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/menu"
                  className="bg-card-dark hover:bg-secondary/60 border border-card-border text-text-light hover:text-primary px-7 py-3.5 rounded-xl font-semibold transition text-center flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Utensils size={18} className="text-primary" />
                  <span>Katalog Menu Sehat</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-card-border/80 max-w-lg">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-text-light">
                    Mifflin-St
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Formula Medis BMR</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-text-light">
                    500+
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Menu Teruji Gizi</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-text-light">
                    100%
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Gratis & Terbuka</p>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Health Snapshot Card (Preview Dashboard) */}
            <div className="w-full lg:w-5/12">
              <div className="bg-card-dark rounded-3xl p-6 sm:p-7 border border-card-border shadow-xl relative overflow-hidden backdrop-blur-xs">
                {/* Header Card */}
                <div className="flex items-center justify-between pb-5 border-b border-card-border/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-light">
                        Ringkasan Gizi Harian
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Simulasi target pola hidup sehat
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck size={12} />
                    Normal (BMI 21.8)
                  </span>
                </div>

                {/* Calorie Goal Progress */}
                <div className="py-5">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                      <Flame size={14} className="text-amber-500" />
                      Target Kalori Harian
                    </span>
                    <span className="text-sm font-bold text-text-light">
                      1.380 / <span className="text-text-muted text-xs">1.950 kkal</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-background-base rounded-full overflow-hidden border border-card-border/60">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: "70%" }}
                    />
                  </div>
                  <p className="text-[11px] text-text-muted mt-1.5 flex justify-between">
                    <span>Sisa kebutuhan: 570 kkal</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">70% Tercapai</span>
                  </p>
                </div>

                {/* Macronutrient Pills */}
                <div className="grid grid-cols-3 gap-2.5 py-4 border-t border-card-border/60">
                  <div className="bg-background-base p-3 rounded-xl border border-card-border/70 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Protein
                    </p>
                    <p className="text-sm font-black text-text-light mt-0.5">85g</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Target 95g
                    </p>
                  </div>
                  <div className="bg-background-base p-3 rounded-xl border border-card-border/70 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Karbo
                    </p>
                    <p className="text-sm font-black text-text-light mt-0.5">180g</p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
                      Target 220g
                    </p>
                  </div>
                  <div className="bg-background-base p-3 rounded-xl border border-card-border/70 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Lemak
                    </p>
                    <p className="text-sm font-black text-text-light mt-0.5">42g</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                      Target 55g
                    </p>
                  </div>
                </div>

                {/* Recent Scanned Item Chip */}
                <div className="mt-2 pt-4 border-t border-card-border/60 flex items-center justify-between text-xs bg-background-base/60 p-3 rounded-xl border border-card-border">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ScanBarcode size={15} />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-text-light truncate">
                        Susu Kedelai Sehat 200ml
                      </p>
                      <p className="text-[10px] text-text-muted">110 kkal • P 7g</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Core Pillars / 4 Fitur Unggulan ── */}
      <section className="py-16 lg:py-24 bg-background-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Ekosistem Lengkap
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-light mt-2 mb-4 tracking-tight">
              Pilar Utama Gaya Hidup Sehat FitLife
            </h2>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed">
              Semua alat yang Anda butuhkan untuk mengatur nutrisi, memantau kalori,
              dan menjaga kebugaran tubuh dalam satu wadah.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Pillar 1: BMI & BMR */}
            <div className="bg-card-dark rounded-2xl p-6 border border-card-border hover:border-primary/50 transition-all flex flex-col group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Scale size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-light mb-2">
                Kalkulator BMI & BMR
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6 grow">
                Hitung indeks massa tubuh, laju metabolisme basal, dan target kalori
                harian sesuai intensitas aktivitas fisik Anda.
              </p>
              <Link
                href="/kalkulator"
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 mt-auto pt-4 border-t border-card-border/60"
              >
                <span>Cek BMI Sekarang</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Pillar 2: Menu Sehat */}
            <div className="bg-card-dark rounded-2xl p-6 border border-card-border hover:border-primary/50 transition-all flex flex-col group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Utensils size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-light mb-2">
                Menu Sehat & Biaya
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6 grow">
                Ratusan resep masakan seimbang dilengkapi takaran nutrisi makro dan
                estimasi biaya belanja bahan terjangkau.
              </p>
              <Link
                href="/menu"
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 mt-auto pt-4 border-t border-card-border/60"
              >
                <span>Lihat Resep Sehat</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Pillar 3: Scan Barcode */}
            <div className="bg-card-dark rounded-2xl p-6 border border-card-border hover:border-primary/50 transition-all flex flex-col group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ScanBarcode size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-light mb-2">
                Scan Barcode Makanan
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6 grow">
                Pindai kemasan makanan saat berbelanja untuk mengetahui nilai
                kalori, gula, dan status verifikasi gizi secara instan.
              </p>
              <Link
                href="/scan-makanan"
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 mt-auto pt-4 border-t border-card-border/60"
              >
                <span>Buka Pemindai</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Pillar 4: Lokasi Olahraga */}
            <div className="bg-card-dark rounded-2xl p-6 border border-card-border hover:border-primary/50 transition-all flex flex-col group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <MapPin size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-light mb-2">
                Peta Lokasi Olahraga
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6 grow">
                Temukan fasilitas gym, lapangan umum, dan taman terbuka di sekitar
                Anda dengan rute navigasi akurat.
              </p>
              <Link
                href="/lokasi"
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 mt-auto pt-4 border-t border-card-border/60"
              >
                <span>Cari Tempat Latihan</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Alur 3 Langkah Sederhana ── */}
      <section className="py-14 sm:py-20 bg-background-base border-t border-card-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-light tracking-tight">
              Bagaimana FitLife Membantu Anda?
            </h2>
            <p className="text-text-muted text-sm mt-2">
              Tiga langkah terukur untuk membentuk kebiasaan hidup sehat tanpa beban.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-card-dark p-6 rounded-2xl border border-card-border relative">
              <span className="text-4xl font-black text-primary/20 dark:text-primary/25 absolute top-5 right-5">
                01
              </span>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary font-bold mb-4">
                <Scale size={20} />
              </div>
              <h4 className="text-base font-bold text-text-light mb-2">
                Ketahui Kondisi Fisik Anda
              </h4>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Gunakan kalkulator BMI dan hitung kebutuhan kalori harian untuk
                memahami target berat badan yang realistis dan aman.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-card-dark p-6 rounded-2xl border border-card-border relative">
              <span className="text-4xl font-black text-primary/20 dark:text-primary/25 absolute top-5 right-5">
                02
              </span>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary font-bold mb-4">
                <Utensils size={20} />
              </div>
              <h4 className="text-base font-bold text-text-light mb-2">
                Atur Menu & Cek Makanan
              </h4>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Pilih menu diet sehat sesuai preferensi rasa, dan scan barcode
                makanan sebelum dikonsumsi agar kalori tetap terkontrol.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-card-dark p-6 rounded-2xl border border-card-border relative">
              <span className="text-4xl font-black text-primary/20 dark:text-primary/25 absolute top-5 right-5">
                03
              </span>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary font-bold mb-4">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="text-base font-bold text-text-light mb-2">
                Bangun Konsistensi Jangka Panjang
              </h4>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Pantau perkembangan Anda, baca artikel edukasi gizi, dan jadikan
                gaya hidup sehat sebagai rutinitas yang menyenangkan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Konten Pilihan Terbaru (Menu & Artikel) ── */}
      <HomeRecentContent />

      {/* ── 5. Clean CTA Banner ── */}
      <section className="py-16 sm:py-20 bg-background-dark/80 border-t border-card-border relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={13} />
            Mulai Hari Ini
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-4 text-text-light tracking-tight">
            Siap Memulai Langkah Hidup Lebih Sehat?
          </h2>
          <p className="text-sm sm:text-base text-text-muted mb-8 max-w-xl mx-auto leading-relaxed">
            Tidak perlu diet ekstrem. Mulai dari mengetahui angka kebutuhan tubuh
            Anda hari ini secara akurat dan gratis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/kalkulator"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base transition shadow-sm"
            >
              <Scale size={18} />
              <span>Hitung BMI Saya Sekarang</span>
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 bg-card-dark hover:bg-secondary/60 border border-card-border text-text-light px-8 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition"
            >
              <span>Jelajahi Menu Sehat</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
