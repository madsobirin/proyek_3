"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LayoutAdmin from "@/components/admin/LayoutAdmin";
import {
  ArrowLeft,
  Locate,
  Loader2,
  Check,
  AlertCircle,
  Building2,
  Map,
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map picker to avoid SSR issues
const LokasiPickerMap = dynamic(
  () => import("@/components/admin/LokasiPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[350px] lg:h-[550px] flex items-center justify-center bg-gray-50 border border-gray-100 rounded-3xl">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
          <span className="text-xs text-gray-500 font-medium">
            Memuat peta satelit HD...
          </span>
        </div>
      </div>
    ),
  },
);

export default function CreateLokasiPage() {
  const router = useRouter();

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<"gym" | "lapangan" | "low_impact">("lapangan");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const useCurrentLocation = () => {
    setErrors((p) => ({ ...p, general: "" }));
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setFormLat(p.coords.latitude.toFixed(6));
          setFormLng(p.coords.longitude.toFixed(6));
        },
        () => {
          setErrors((p) => ({
            ...p,
            general:
              "Gagal mengambil lokasi dari browser. Pastikan izin lokasi diberikan.",
          }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      setErrors((p) => ({
        ...p,
        general: "Fitur lokasi tidak didukung oleh browser Anda.",
      }));
    }
  };

  const handleSave = async () => {
    setErrors({});

    // Validasi
    const newErrors: Record<string, string> = {};
    if (!formName.trim()) {
      newErrors.name = "Nama lokasi harus diisi";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: formName.trim(),
        category: formCategory,
      };
      if (formAddress.trim()) body.address = formAddress.trim();
      if (formLat && formLng) {
        body.latitude = parseFloat(formLat);
        body.longitude = parseFloat(formLng);
      }

      const res = await fetch("/api/lokasi-olahraga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        setErrors({ general: d.message || "Gagal menyimpan lokasi." });
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/lokasi");
      }, 1500);
    } catch {
      setErrors({ general: "Terjadi kesalahan koneksi saat menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <LayoutAdmin>
      <div className="p-4 md:p-8 max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/lokasi"
            className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Tambah Lokasi Baru
            </h1>
            <p className="text-gray-500 text-sm">
              Buat data tempat olahraga baru dengan penanda peta satelit HD
            </p>
          </div>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Form */}
          <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Building2 className="w-4 h-4 text-[#22c55e]" />
              Detail Lokasi
            </h2>

            {/* Nama Lokasi */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Nama Lokasi <span className="text-red-500">*</span>
              </label>
              <input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="Contoh: GOR Polindra, Lapangan Merdeka..."
                className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent text-sm transition-all ${
                  errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                </p>
              )}
            </div>

            {/* Kategori Fasilitas (Rekomendasi BMI) */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Kategori Fasilitas (Target BMI) <span className="text-red-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) =>
                  setFormCategory(
                    e.target.value as "gym" | "lapangan" | "low_impact",
                  )
                }
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent text-sm transition-all"
              >
                <option value="gym">
                  🏋️ Fitness Center / Gym (Rekomendasi: Underweight / Kurus)
                </option>
                <option value="lapangan">
                  🏟️ Lapangan / Komunitas Olahraga (Rekomendasi: Normal)
                </option>
                <option value="low_impact">
                  🏊 Low-Impact: Jalur Jogging / Kolam Renang (Rekomendasi: Overweight / Obesitas)
                </option>
              </select>
            </div>

            {/* Alamat */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Alamat Lengkap
              </label>
              <textarea
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Jl. Raya Lohbener No. 1..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent text-sm transition-all resize-none"
              />
            </div>

            {/* Koordinat */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Koordinat Lokasi
                </label>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="flex items-center gap-1.5 text-[#22c55e] text-xs font-bold hover:underline"
                >
                  <Locate className="w-3.5 h-3.5" /> Gunakan lokasi GPS saya
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-gray-400 font-medium mb-1 block">
                    Latitude
                  </span>
                  <input
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    placeholder="Latitude"
                    type="number"
                    step="any"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent text-sm transition-all"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium mb-1 block">
                    Longitude
                  </span>
                  <input
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    placeholder="Longitude"
                    type="number"
                    step="any"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* General Errors / Success */}
            {errors.general && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.general}
              </div>
            )}

            {success && (
              <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                Lokasi berhasil disimpan! Mengalihkan...
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50">
              <Link
                href="/admin/lokasi"
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all text-center"
              >
                Batal
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : success ? (
                  <Check className="w-4 h-4" />
                ) : (
                  "Simpan Lokasi"
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Large Map Picker */}
          <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b border-gray-50 pb-3 px-2">
              <Map className="w-4 h-4 text-[#22c55e]" />
              Maps
            </h2>
            <div className="p-1">
              <LokasiPickerMap
                lat={formLat}
                lng={formLng}
                height="500px"
                onChange={(newLat, newLng, address) => {
                  setFormLat(newLat);
                  setFormLng(newLng);
                  if (address) {
                    setFormAddress(address);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </LayoutAdmin>
  );
}
