"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Trash2,
  MapPin,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import LayoutAdmin from "@/components/admin/LayoutAdmin";

interface Lokasi {
  id: number;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  account: { name: string | null };
}

const ITEMS_PER_PAGE = 8;

export default function LokasiAdminPage() {
  const [locations, setLocations] = useState<Lokasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (debouncedSearch) p.set("search", debouncedSearch);
      const res = await fetch(`/api/lokasi-olahraga?${p.toString()}`);
      if (!res.ok) throw new Error();
      setLocations(await res.json());
    } catch {
      setError("Gagal memuat data lokasi");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lokasi-olahraga/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLocations((p) => p.filter((l) => l.id !== id));
        setDeleteConfirm(null);
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 2500);
      } else setError("Gagal menghapus lokasi");
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(locations.length / ITEMS_PER_PAGE));
  const paginated = locations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      )
        pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <LayoutAdmin>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Daftar Lokasi Olahraga
            </h1>
            <p className="text-gray-500 text-sm">
              {loading ? "Memuat..." : `${locations.length} lokasi tersedia`}
            </p>
          </div>
          <Link
            href="/admin/lokasi/create"
            className="w-fit bg-[#22c55e] hover:bg-[#16a34a] text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-green-500/20"
          >
            <Plus className="w-5 h-5" /> Tambah Lokasi
          </Link>
        </div>

        {/* Toasts */}
        {deleteSuccess && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Lokasi berhasil dihapus
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#22c55e] focus:border-transparent text-sm transition-all outline-none text-slate-700"
              placeholder="Cari nama atau alamat lokasi..."
              type="text"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>



        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
              <p className="text-gray-400 text-sm">Memuat lokasi...</p>
            </div>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              Tidak ada lokasi ditemukan
            </p>
            {debouncedSearch && (
              <button
                onClick={() => setSearch("")}
                className="text-[#22c55e] text-sm font-medium hover:underline"
              >
                Reset pencarian
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden mb-6">
              {paginated.map((item, i) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono text-gray-400">
                          #
                          {String(
                            (currentPage - 1) * ITEMS_PER_PAGE + i + 1,
                          ).padStart(2, "0")}
                        </span>
                        {item.latitude && item.longitude && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                            {item.latitude.toFixed(4)},{" "}
                            {item.longitude.toFixed(4)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {item.address || "Alamat belum diisi"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                    <Link
                      href={`/admin/lokasi/${item.id}/edit`}
                      className="flex items-center justify-center py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Link>
                    {deleteConfirm === item.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="flex-1 flex items-center justify-center py-2 bg-red-500 text-white rounded-lg text-xs font-semibold"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Yakin?"
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 flex items-center justify-center py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(item.id)}
                        className="flex items-center justify-center py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {[
                        "No",
                        "Nama Lokasi",
                        "Alamat",
                        "Koordinat",
                        "Oleh",
                        "Aksi",
                      ].map((h) => (
                        <th
                          key={h}
                          className={`px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === "Aksi" ? "text-right" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((item, i) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-5 text-sm text-gray-400 font-mono">
                          {String(
                            (currentPage - 1) * ITEMS_PER_PAGE + i + 1,
                          ).padStart(2, "0")}
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-semibold text-gray-900 text-sm">
                            {item.name}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-600 line-clamp-2 max-w-[200px]">
                            {item.address || "-"}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            <MapPin className="w-3 h-3" />
                            {item.latitude && item.longitude
                              ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                              : "Tidak di set"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {item.account?.name || "-"}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/lokasi/${item.id}/edit`}
                              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            {deleteConfirm === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deletingId === item.id}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                  {deletingId === item.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    "Yakin?"
                                  )}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(item.id)}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 px-2 sm:px-4 py-4 bg-white border border-gray-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-sm text-gray-500 order-2 sm:order-1">
                  Menampilkan{" "}
                  <span className="font-semibold text-gray-900">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, locations.length)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-gray-900">
                    {locations.length}
                  </span>{" "}
                  lokasi
                </span>
                <div className="flex items-center gap-1.5 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 transition-all text-gray-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getPageNumbers().map((page, i) =>
                    page === "..." ? (
                      <span
                        key={`dots-${i}`}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm"
                      >
                        ···
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`w-9 h-9 flex items-center justify-center text-sm rounded-xl font-medium transition-all ${currentPage === page ? "bg-[#22c55e] text-white shadow-md shadow-green-500/20 font-bold" : "border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"}`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 transition-all text-gray-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </LayoutAdmin>
  );
}
