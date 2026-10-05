"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import LayoutAdmin from "@/components/admin/LayoutAdmin";
import Image from "next/image";
import {
  ScanBarcode,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Upload,
  ExternalLink,
  ShieldCheck,
  Users,
  Globe,
  Flame,
  Database,
  ArrowUpDown,
} from "lucide-react";

interface Contributor {
  id: number;
  name: string;
  email: string;
}

interface MasterMakananItem {
  id: number;
  barcode: string;
  nama_makanan: string;
  brand: string | null;
  image_url: string | null;
  kalori: number | null;
  protein: number | null;
  lemak: number | null;
  karbohidrat: number | null;
  gula: number | null;
  source: string;
  scan_count: number;
  contributor: Contributor | null;
  created_at: string | null;
  updated_at: string | null;
}

interface StatsData {
  total: number;
  verified: number;
  community: number;
  openfoodfacts: number;
  totalScans: number;
}

interface FormDataState {
  barcode: string;
  nama_makanan: string;
  brand: string;
  image_url: string;
  kalori: string;
  protein: string;
  lemak: string;
  karbohidrat: string;
  gula: string;
  source: "verified" | "community" | "openfoodfacts";
}

const initialFormData: FormDataState = {
  barcode: "",
  nama_makanan: "",
  brand: "",
  image_url: "",
  kalori: "",
  protein: "",
  lemak: "",
  karbohidrat: "",
  gula: "",
  source: "verified",
};

export default function MasterMakananPage() {
  const [items, setItems] = useState<MasterMakananItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Stats
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    verified: 0,
    community: 0,
    openfoodfacts: 0,
    totalScans: 0,
  });

  // Filter & Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "scan_count" | "nama_makanan">("created_at");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterMakananItem | null>(null);
  const [formData, setFormData] = useState<FormDataState>(initialFormData);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Uploading state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick Verify action state
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Copied barcode tracking
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Auto hide notification
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch foods
  const fetchFoods = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy,
        order,
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (sourceFilter) params.append("source", sourceFilter);

      const res = await fetch(`/api/admin/master-makanan?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data produk");
      }
      const json = await res.json();
      setItems(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotalCount(json.pagination?.total || 0);
      if (json.stats) {
        setStats(json.stats);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setIsFetching(false);
      setInitialLoading(false);
    }
  }, [page, debouncedSearch, sourceFilter, sortBy, order]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // Copy Barcode
  const handleCopyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedBarcode(barcode);
    setTimeout(() => {
      setCopiedBarcode(null);
    }, 2000);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: MasterMakananItem) => {
    setEditingItem(item);
    setFormData({
      barcode: item.barcode,
      nama_makanan: item.nama_makanan,
      brand: item.brand || "",
      image_url: item.image_url || "",
      kalori: item.kalori !== null ? String(item.kalori) : "",
      protein: item.protein !== null ? String(item.protein) : "",
      lemak: item.lemak !== null ? String(item.lemak) : "",
      karbohidrat: item.karbohidrat !== null ? String(item.karbohidrat) : "",
      gula: item.gula !== null ? String(item.gula) : "",
      source: (item.source as "verified" | "community" | "openfoodfacts") || "verified",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Quick Verify
  const handleQuickVerify = async (id: number) => {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/admin/master-makanan/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "verified" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memverifikasi produk");
      }
      setNotification({
        type: "success",
        message: "Produk berhasil ditandai sebagai Terverifikasi Resmi",
      });
      fetchFoods();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setNotification({ type: "error", message });
    } finally {
      setVerifyingId(null);
    }
  };

  // Delete product
  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/master-makanan/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus produk");
      }
      setNotification({
        type: "success",
        message: "Produk berhasil dihapus dari master makanan & cache",
      });
      setDeleteConfirmId(null);
      fetchFoods();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setNotification({ type: "error", message });
    } finally {
      setDeleting(false);
    }
  };

  // Upload image to Cloudinary via /api/scan-makanan/upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);
    const bodyData = new FormData();
    bodyData.append("image", file);

    try {
      const res = await fetch("/api/scan-makanan/upload", {
        method: "POST",
        body: bodyData,
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal mengunggah foto");
      }
      const url = result.url || result.image_url;
      setFormData((prev) => ({ ...prev, image_url: url }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengunggah foto";
      setFormError(message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const barcodeTrimmed = formData.barcode.trim();
    if (!/^\d{3,64}$/.test(barcodeTrimmed)) {
      setFormError("Barcode harus berupa angka (3-64 digit)");
      return;
    }

    if (!formData.nama_makanan.trim()) {
      setFormError("Nama produk makanan wajib diisi");
      return;
    }

    const parseNum = (val: string) => {
      const trimmed = val.trim();
      if (!trimmed) return null;
      const num = Number(trimmed);
      return Number.isFinite(num) ? num : NaN;
    };

    const kaloriNum = parseNum(formData.kalori);
    const proteinNum = parseNum(formData.protein);
    const lemakNum = parseNum(formData.lemak);
    const karbohidratNum = parseNum(formData.karbohidrat);
    const gulaNum = parseNum(formData.gula);

    if (
      Number.isNaN(kaloriNum) ||
      Number.isNaN(proteinNum) ||
      Number.isNaN(lemakNum) ||
      Number.isNaN(karbohidratNum) ||
      Number.isNaN(gulaNum)
    ) {
      setFormError("Nilai gizi harus berupa angka yang valid atau dikosongkan");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        barcode: barcodeTrimmed,
        nama_makanan: formData.nama_makanan.trim(),
        brand: formData.brand.trim() || null,
        image_url: formData.image_url.trim() || null,
        kalori: kaloriNum,
        protein: proteinNum,
        lemak: lemakNum,
        karbohidrat: karbohidratNum,
        gula: gulaNum,
        source: formData.source,
      };

      const url = editingItem
        ? `/api/admin/master-makanan/${editingItem.id}`
        : "/api/admin/master-makanan";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.message || "Gagal menyimpan data produk");
      }

      setIsModalOpen(false);
      setNotification({
        type: "success",
        message: editingItem
          ? "Produk makanan master berhasil diperbarui"
          : "Produk makanan master resmi berhasil didaftarkan",
      });
      fetchFoods();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <LayoutAdmin>
      <div className="space-y-6">
        {/* Toast / Notification Banner */}
        {notification && (
          <div
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <ScanBarcode className="w-7 h-7 text-emerald-600" />
              Master Scan Makanan
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kurasi, verifikasi keakuratan nutrisi, dan kelola database barcode produk FitLife.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm hover:shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk Baru
          </button>
        </div>

        {/* 1. Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Produk
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Semua data terdaftar</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Verified */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Terverifikasi
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.verified}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Resmi tervalidasi</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Community */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider">
                Komunitas
              </p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.community}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Input dari pengguna</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Total Scans */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">
                Total Scan
              </p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.totalScans}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Aktivitas pemindaian</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2. Filter & Search Controls */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari barcode, nama makanan, atau brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Source Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => {
                  setSourceFilter("");
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  sourceFilter === ""
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Semua Sumber
              </button>
              <button
                onClick={() => {
                  setSourceFilter("verified");
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  sourceFilter === "verified"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Terverifikasi
              </button>
              <button
                onClick={() => {
                  setSourceFilter("community");
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  sourceFilter === "community"
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Komunitas
              </button>
              <button
                onClick={() => {
                  setSourceFilter("openfoodfacts");
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  sourceFilter === "openfoodfacts"
                    ? "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Open Food Facts
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as "created_at" | "scan_count" | "nama_makanan");
                    setPage(1);
                  }}
                  className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="created_at">Terbaru Dibuat</option>
                  <option value="scan_count">Paling Banyak Discan</option>
                  <option value="nama_makanan">Nama Produk (A-Z)</option>
                </select>
              </div>

              <button
                onClick={() => setOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                title={`Urutan: ${order === "desc" ? "Menurun (Z-A / Baru)" : "Menaik (A-Z / Lama)"}`}
                className="p-2 border border-gray-200 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100 transition"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Product Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
          {isFetching && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse z-10" />
          )}

          {initialLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm">Memuat data master makanan...</p>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center text-red-500 gap-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={fetchFoods}
                className="mt-2 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
              >
                Coba Lagi
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
              <ScanBarcode className="w-12 h-12 text-gray-300 stroke-[1.5]" />
              <p className="text-sm font-medium text-gray-600">Tidak ada produk makanan yang cocok</p>
              <p className="text-xs text-gray-400">
                Ubah kata kunci pencarian atau filter sumber makanan.
              </p>
            </div>
          ) : (
            <div className={`overflow-x-auto transition-opacity duration-150 ${isFetching ? "opacity-60" : "opacity-100"}`}>
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/80 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3.5">Foto</th>
                    <th className="px-4 py-3.5">Barcode</th>
                    <th className="px-4 py-3.5">Produk & Merek</th>
                    <th className="px-4 py-3.5">Gizi per Porsi</th>
                    <th className="px-4 py-3.5">Sumber & Status</th>
                    <th className="px-4 py-3.5 text-center">Scan</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const isVerified = item.source === "verified";
                    const isCommunity = item.source === "community";

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition">
                        {/* Foto */}
                        <td className="px-4 py-3">
                          <div
                            onClick={() =>
                              item.image_url &&
                              setPreviewImage({
                                url: item.image_url,
                                title: item.nama_makanan,
                              })
                            }
                            className={`w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 ${
                              item.image_url ? "cursor-pointer hover:opacity-80" : ""
                            }`}
                          >
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.nama_makanan}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <ScanBarcode className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                        </td>

                        {/* Barcode */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-md font-semibold tracking-wider">
                              {item.barcode}
                            </span>
                            <button
                              onClick={() => handleCopyBarcode(item.barcode)}
                              title="Salin Barcode"
                              className="p-1 text-gray-400 hover:text-gray-700 rounded transition"
                            >
                              {copiedBarcode === item.barcode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Produk & Merek */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="font-semibold text-gray-900 leading-tight">
                            {item.nama_makanan}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.brand ? item.brand : <span className="italic">Tanpa Merek</span>}
                          </p>
                        </td>

                        {/* Gizi per porsi */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 text-[11px]">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-medium">
                              🔥 {item.kalori ?? "-"} kkal
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
                              P: {item.protein ?? "-"}g
                            </span>
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md font-medium">
                              L: {item.lemak ?? "-"}g
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-medium">
                              K: {item.karbohidrat ?? "-"}g
                            </span>
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-medium">
                              G: {item.gula ?? "-"}g
                            </span>
                          </div>
                        </td>

                        {/* Sumber & Status */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Terverifikasi
                              </span>
                            ) : isCommunity ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                <Users className="w-3.5 h-3.5" />
                                Komunitas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                <Globe className="w-3.5 h-3.5" />
                                Open Food Facts
                              </span>
                            )}

                            {item.contributor && (
                              <p className="text-[11px] text-gray-400 truncate max-w-[150px]">
                                Oleh: {item.contributor.name}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Scan Count */}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            <Flame className="w-3 h-3 text-amber-500" />
                            {item.scan_count}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Verifikasi Cepat */}
                            {!isVerified && (
                              <button
                                onClick={() => handleQuickVerify(item.id)}
                                disabled={verifyingId === item.id}
                                title="Verifikasi Cepat Resmi"
                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition disabled:opacity-50"
                              >
                                {verifyingId === item.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit Data Produk"
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Hapus */}
                            {deleteConfirmId === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deleting}
                                  className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50"
                                >
                                  {deleting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    "Yakin?"
                                  )}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(item.id)}
                                title="Hapus Produk"
                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Pagination */}
          {!initialLoading && !error && items.length > 0 && (
            <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Menampilkan{" "}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * 10 + 1}–{Math.min(page * 10, totalCount)}
                </span>{" "}
                dari <span className="font-semibold text-gray-900">{totalCount}</span> produk master
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-700 px-2">
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Modal Tambah / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100 my-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingItem ? "Edit Data Master Makanan" : "Tambah Produk Makanan Master"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="mt-4 space-y-4">
                {/* Barcode & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Barcode (3-64 Digit) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 8992388123456"
                      value={formData.barcode}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, barcode: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Merek / Brand
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Indofood, Ultra Milk"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, brand: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Nama Makanan */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nama Makanan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Susu UHT Cokelat 250ml"
                    value={formData.nama_makanan}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nama_makanan: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Upload Foto / URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Foto Produk (Upload Cloudinary / Link URL)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="https://res.cloudinary.com/... atau pilih file"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </button>
                  </div>
                  {formData.image_url && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={formData.image_url}
                          alt="Preview"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 truncate max-w-xs">
                        {formData.image_url}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nilai Nutrisi */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Informasi Nilai Gizi (Per Porsi / Sajian)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-1">Kalori (kkal)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={formData.kalori}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, kalori: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-1">Protein (g)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={formData.protein}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, protein: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-1">Lemak (g)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={formData.lemak}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, lemak: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-1">Karbohidrat (g)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={formData.karbohidrat}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, karbohidrat: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-1">Gula (g)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={formData.gula}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, gula: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Verifikasi / Source */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="verifiedCheck"
                      checked={formData.source === "verified"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          source: e.target.checked ? "verified" : "community",
                        }))
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    />
                    <label htmlFor="verifiedCheck" className="text-xs font-semibold text-gray-800">
                      Tandai sebagai Terverifikasi Resmi
                    </label>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingItem ? "Simpan Perubahan" : "Tambah Produk"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. Modal Image Preview */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {previewImage.title}
                </p>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full h-80 relative rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={previewImage.url}
                  alt={previewImage.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="mt-3 flex justify-end">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1"
                >
                  Buka Gambar Penuh <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutAdmin>
  );
}
