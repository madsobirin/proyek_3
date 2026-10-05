"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import LayoutAdmin from "@/components/admin/LayoutAdmin";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  ImageIcon,
  Flame,
  Clock,
  FileText,
  Tag,
  Wallet,
  Check,
  Loader2,
  X,
} from "lucide-react";

const TARGET_STATUS_OPTIONS = [
  {
    value: "Kurus",
    label: "Kurus",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    value: "Normal",
    label: "Normal",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    value: "Berlebih",
    label: "Berlebih",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    value: "Obesitas",
    label: "Obesitas",
    color: "bg-red-100 text-red-700 border-red-200",
  },
];

type FormData = {
  nama_menu: string;
  deskripsi: string;
  kalori: string;
  target_status: string;
  waktu_memasak: string;
  biaya_per_porsi: string;
  gambar: string;
};

type FormErrors = Partial<Record<keyof FormData, string[]>>;

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    nama_menu: "",
    deskripsi: "",
    kalori: "",
    target_status: "",
    waktu_memasak: "",
    biaya_per_porsi: "",
    gambar: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Fetch data menu existing
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch(`/api/menus/${slug}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setForm({
          nama_menu: data.nama_menu ?? "",
          deskripsi: data.deskripsi ?? "",
          kalori: data.kalori?.toString() ?? "",
          target_status: data.target_status ?? "",
          waktu_memasak: data.waktu_memasak?.toString() ?? "",
          biaya_per_porsi: data.biaya_per_porsi?.toString() ?? "",
          gambar: data.gambar ?? "",
        });
        if (data.gambar) setImagePreview(data.gambar);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Tipe file tidak didukung");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "fitlife/menu");

      const res = await fetch("/api/upload/menu", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, gambar: data.url }));
      } else {
        setUploadError(data.message || "Gagal upload gambar");
        setImagePreview(form.gambar || null);
      }
    } catch {
      setUploadError("Terjadi kesalahan saat upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setForm((prev) => ({ ...prev, gambar: "" }));
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch(`/api/menus/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_menu: form.nama_menu,
          deskripsi: form.deskripsi,
          kalori: form.kalori ? parseInt(form.kalori) : undefined,
          target_status: form.target_status || undefined,
          waktu_memasak: form.waktu_memasak
            ? parseInt(form.waktu_memasak)
            : undefined,
          biaya_per_porsi: form.biaya_per_porsi
            ? parseInt(form.biaya_per_porsi)
            : undefined,
          gambar: form.gambar,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/admin/menu"), 1200);
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ nama_menu: [data.message || "Terjadi kesalahan"] });
      }
    } catch {
      setErrors({ nama_menu: ["Terjadi kesalahan server"] });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#22c55e] focus:border-transparent text-sm transition-all outline-none text-gray-800 placeholder:text-gray-400 ${
      errors[field] ? "border-red-300 bg-red-50" : "border-gray-200"
    }`;

  if (loading) {
    return (
      <LayoutAdmin>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
            <p className="text-gray-500 text-sm">Memuat data menu...</p>
          </div>
        </div>
      </LayoutAdmin>
    );
  }

  if (notFound) {
    return (
      <LayoutAdmin>
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-gray-900 font-bold text-lg">
            Menu tidak ditemukan
          </p>
          <Link
            href="/admin/menu"
            className="text-[#22c55e] text-sm font-medium hover:underline"
          >
            ← Kembali ke daftar menu
          </Link>
        </div>
      </LayoutAdmin>
    );
  }

  return (
    <LayoutAdmin>
      <div className="p-4 md:p-8 mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/menu"
            className="p-2 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Menu</h1>
            <p className="text-gray-500 text-sm">
              Perbarui detail menu makanan
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ── Upload Gambar ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className=" text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#22c55e]" />
              Foto Menu
            </label>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={600}
                  height={240}
                  className="w-full h-48 object-cover"
                  unoptimized
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#22c55e] animate-spin" />
                    <span className="text-xs text-gray-500 font-medium">
                      Mengupload gambar...
                    </span>
                  </div>
                )}
                {!uploading && (
                  <>
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg shadow border border-gray-200 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 rounded-lg shadow border border-gray-200 text-gray-600 hover:text-[#22c55e] transition-colors px-2.5 py-1.5 text-xs font-medium"
                    >
                      <Upload className="w-3 h-3" /> Ganti Foto
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-[#22c55e] bg-green-50"
                    : "border-gray-200 hover:border-[#22c55e] hover:bg-green-50/50"
                }`}
              >
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">
                  Klik atau drag foto ke sini
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, WebP — Maks. 3MB
                </p>
              </div>
            )}

            {uploadError && (
              <p className="text-red-500 text-xs mt-2">{uploadError}</p>
            )}
            {errors.gambar && (
              <p className="text-red-500 text-xs mt-2">{errors.gambar[0]}</p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
              className="hidden"
            />
          </div>

          {/* ── Info Dasar ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#22c55e]" />
              Informasi Menu
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Nama Menu <span className="text-red-400">*</span>
              </label>
              <input
                name="nama_menu"
                value={form.nama_menu}
                onChange={handleChange}
                placeholder="Contoh: Salad Brokoli Segar"
                className={inputClass("nama_menu")}
              />
              {errors.nama_menu && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.nama_menu[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <Wallet className="w-3.5 h-3.5 inline mr-1" />
                Estimasi Biaya per Porsi (Rp){" "}
                <span className="text-red-400">*</span>
              </label>
              <input
                name="biaya_per_porsi"
                type="number"
                min="1"
                max="100000000"
                value={form.biaya_per_porsi}
                onChange={handleChange}
                placeholder="15000"
                className={inputClass("biaya_per_porsi")}
              />
              {!form.biaya_per_porsi && (
                <p className="text-amber-600 text-xs mt-1">
                  Menu ini belum memiliki estimasi biaya. Isi untuk menyimpan
                  perubahan.
                </p>
              )}
              {errors.biaya_per_porsi && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.biaya_per_porsi[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Deskripsi <span className="text-red-400">*</span>
              </label>
              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                placeholder="Jelaskan bahan-bahan dan cara penyajian menu..."
                rows={4}
                className={`${inputClass("deskripsi")} resize-none`}
              />
              {errors.deskripsi && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.deskripsi[0]}
                </p>
              )}
            </div>
          </div>

          {/* ── Detail Nutrisi ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#22c55e]" />
              Detail Nutrisi & Waktu
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Kalori (kkal) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    name="kalori"
                    type="number"
                    min="0"
                    value={form.kalori}
                    onChange={handleChange}
                    placeholder="230"
                    className={inputClass("kalori")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    kkal
                  </span>
                </div>
                {errors.kalori && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.kalori[0]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Waktu Memasak <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="waktu_memasak"
                    type="number"
                    min="1"
                    value={form.waktu_memasak}
                    onChange={handleChange}
                    placeholder="20"
                    className={`${inputClass("waktu_memasak")} pl-9`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    menit
                  </span>
                </div>
                {errors.waktu_memasak && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.waktu_memasak[0]}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Target Status <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TARGET_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, target_status: opt.value }));
                      if (errors.target_status)
                        setErrors((p) => ({ ...p, target_status: undefined }));
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                      form.target_status === opt.value
                        ? opt.color + " border-current scale-[1.02] shadow-sm"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {errors.target_status && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.target_status[0]}
                </p>
              )}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pb-4">
            <Link
              href="/admin/menu"
              className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all text-center"
            >
              Batal
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving || uploading}
              className="flex-1 sm:flex-none bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-gray-200 disabled:text-gray-400 text-white px-8 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 disabled:shadow-none"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" /> Tersimpan!
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </div>
      </div>
    </LayoutAdmin>
  );
}
