"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Weight,
  Ruler,
  Edit3,
  Check,
  X,
  ShieldCheck,
  Loader2,
  Sparkles,
  Clock,
  AtSign,
  Camera,
  Upload,
  KeyRound,
} from "lucide-react";

type ProfileData = {
  id: number;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  phone: string | null;
  birthdate: string | null;
  weight: number | null;
  height: number | null;
  photo: string | null;
  google_avatar: string | null;
  created_at: string | null;
  last_login_at: string | null;
  password?: string | null;
};

type EditableField = {
  key: keyof ProfileData;
  label: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  editable: boolean;
};

const fields: EditableField[] = [
  {
    key: "name",
    label: "Nama Lengkap",
    icon: <User size={15} />,
    type: "text",
    placeholder: "Masukkan nama lengkap",
    editable: true,
  },
  {
    key: "username",
    label: "Username",
    icon: <AtSign size={15} />,
    type: "text",
    placeholder: "Masukkan username",
    editable: true,
  },
  {
    key: "email",
    label: "Email Address",
    icon: <Mail size={15} />,
    type: "email",
    placeholder: "Email",
    editable: false,
  },
  {
    key: "phone",
    label: "Nomor Telepon",
    icon: <Phone size={15} />,
    type: "tel",
    placeholder: "Masukkan nomor telepon",
    editable: true,
  },
  {
    key: "birthdate",
    label: "Tanggal Lahir",
    icon: <Calendar size={15} />,
    type: "date",
    placeholder: "",
    editable: true,
  },
  {
    key: "weight",
    label: "Berat Badan (kg)",
    icon: <Weight size={15} />,
    type: "number",
    placeholder: "Berat dalam kg",
    editable: true,
  },
  {
    key: "height",
    label: "Tinggi Badan (cm)",
    icon: <Ruler size={15} />,
    type: "number",
    placeholder: "Tinggi dalam cm",
    editable: true,
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<keyof ProfileData | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<keyof ProfileData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Upload states
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
      }
    } catch {
      setError("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── File handling ──
  const handleFileSelect = (file: File) => {
    setUploadError(null);
    if (
      !["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(
        file.type,
      )
    ) {
      setUploadError("Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 2MB");
      return;
    }
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("photo", uploadFile);
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setUploadPreview(null);
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        window.dispatchEvent(new CustomEvent("profile:updated")); // ← di sini
      } else {
        setUploadError(data.message || "Gagal mengupload foto");
      }
    } catch {
      setUploadError("Terjadi kesalahan saat upload");
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setUploadPreview(null);
    setUploadFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Field edit ──
  const startEdit = (field: EditableField) => {
    if (!field.editable) return;
    setEditingField(field.key);
    const val = profile?.[field.key];
    if (field.type === "date" && val) {
      setEditValue(new Date(val as string).toISOString().split("T")[0]);
    } else {
      setEditValue(val != null ? String(val) : "");
    }
    setError(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
    setError(null);
  };

  const saveField = async (key: keyof ProfileData) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: editValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setEditingField(null);
        setSaveSuccess(key);
        setTimeout(() => setSaveSuccess(null), 2000);
      } else {
        setError(data.message || "Gagal menyimpan");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  // ── Password change ──
  const handlePasswordChange = async () => {
    setPasswordError(null);
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError("Password baru tidak cocok");
      return;
    }
    if (passwordForm.new.length < 8) {
      setPasswordError("Password baru minimal 8 karakter");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setPasswordForm({ current: "", new: "", confirm: "" });
        setTimeout(() => {
          setPasswordSuccess(false);
          setShowPasswordForm(false);
        }, 2500);
      } else {
        setPasswordError(data.message || "Gagal mengubah password");
      }
    } catch {
      setPasswordError("Terjadi kesalahan");
    } finally {
      setPasswordSaving(false);
    }
  };

  const formatValue = (
    field: EditableField,
    val: ProfileData[keyof ProfileData],
  ) => {
    if (val === null || val === undefined || val === "") return null;
    if (field.type === "date") {
      return new Date(val as string).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    return String(val);
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (profile?.email?.[0]?.toUpperCase() ?? "U");

  const bmi =
    profile?.weight && profile?.height
      ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
      : null;

  const bmiCategory = bmi
    ? parseFloat(bmi) < 18.5
      ? {
          label: "Kurus",
          color: "text-blue-400",
          bg: "bg-blue-400/10 border-blue-400/20",
        }
      : parseFloat(bmi) < 25
        ? {
            label: "Normal",
            color: "text-primary",
            bg: "bg-primary/10 border-primary/20",
          }
        : parseFloat(bmi) < 30
          ? {
              label: "Gemuk",
              color: "text-yellow-400",
              bg: "bg-yellow-400/10 border-yellow-400/20",
            }
          : {
              label: "Obesitas",
              color: "text-red-400",
              bg: "bg-red-400/10 border-red-400/20",
            }
    : null;

  const currentAvatar =
    uploadPreview || profile?.photo || profile?.google_avatar;
  // Apakah user punya password (bukan pure Google login)
  const hasPassword =
    profile?.password !== null && profile?.password !== undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-text-muted text-sm">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background-base">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        {/* ── Hero Profile Card ── */}
        <div
          className="relative rounded-3xl overflow-hidden border border-card-border bg-card-dark mb-6 shadow-2xl"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="h-1 w-full bg-linear-to-r from-transparent via-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* ── Avatar Upload Section ── */}
              <div className="relative shrink-0 flex flex-col items-center gap-3">
                {/* Avatar circle */}
                <div
                  className={`relative group/avatar w-24 h-24 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 ${
                    dragOver
                      ? "border-primary scale-105 shadow-[0_0_30px_rgba(0,255,127,0.4)]"
                      : "border-primary/40 hover:border-primary shadow-[0_0_20px_rgba(0,255,127,0.15)] hover:shadow-[0_0_30px_rgba(0,255,127,0.3)]"
                  }`}
                  onClick={() =>
                    !uploadPreview && fileInputRef.current?.click()
                  }
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  title="Klik atau drag foto untuk mengubah"
                >
                  {/* Avatar image / initials */}
                  <div className="w-full h-full flex items-center justify-center bg-card-dark text-primary font-black text-2xl">
                    {currentAvatar ? (
                      <Image
                        src={currentAvatar}
                        alt={profile.name ?? "User"}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  {/* Hover overlay */}
                  {!uploadPreview && (
                    <div className="absolute inset-0 bg-background-dark/70 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                      <Camera size={20} className="text-primary" />
                      <span className="text-[10px] text-primary font-bold">
                        Ubah Foto
                      </span>
                    </div>
                  )}
                </div>

                {/* Preview upload state */}
                {uploadPreview && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-background-dark rounded-lg text-xs font-bold hover:bg-primary-hover transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(0,255,127,0.25)]"
                    >
                      {uploading ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Upload size={11} />
                      )}
                      {uploading ? "Uploading..." : "Simpan"}
                    </button>
                    <button
                      onClick={cancelUpload}
                      disabled={uploading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-background-base border border-card-border text-text-muted rounded-lg text-xs font-bold hover:text-text-light transition-all"
                    >
                      <X size={11} /> Batal
                    </button>
                  </div>
                )}

                {!uploadPreview && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Camera size={11} /> Ubah foto
                  </button>
                )}

                {uploadError && (
                  <p className="text-red-400 text-xs text-center max-w-[120px]">
                    {uploadError}
                  </p>
                )}

                {/* Online dot */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-card-dark shadow-[0_0_8px_rgba(0,255,127,0.6)]" />

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Profile info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-text-light truncate">
                    {profile.name ?? "Pengguna"}
                  </h1>
                  {profile.role === "admin" && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary font-bold bg-primary/10 border border-primary/25 px-2.5 py-1 rounded-full w-fit mx-auto sm:mx-0">
                      <ShieldCheck size={11} /> Admin
                    </span>
                  )}
                </div>
                {profile.username && (
                  <p className="text-text-muted text-sm mb-1">
                    @{profile.username}
                  </p>
                )}
                <p className="text-text-muted text-sm mb-3">{profile.email}</p>

                {/* Stats row */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  {profile.created_at && (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Sparkles size={12} className="text-primary/50" />
                      <span>
                        Bergabung{" "}
                        {new Date(profile.created_at).toLocaleDateString(
                          "id-ID",
                          { month: "long", year: "numeric" },
                        )}
                      </span>
                    </div>
                  )}
                  {profile.last_login_at && (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Clock size={12} className="text-primary/50" />
                      <span>
                        Login{" "}
                        {new Date(profile.last_login_at).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* BMI Badge */}
              {bmi && bmiCategory && (
                <div
                  className={`shrink-0 text-center border rounded-2xl px-5 py-3 ${bmiCategory.bg}`}
                >
                  <p className="text-xs text-text-muted uppercase tracking-widest mb-1 font-bold">
                    BMI
                  </p>
                  <p className={`text-3xl font-black ${bmiCategory.color}`}>
                    {bmi}
                  </p>
                  <p
                    className={`text-xs font-bold mt-0.5 ${bmiCategory.color}`}
                  >
                    {bmiCategory.label}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Fields Grid ── */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
          }}
        >
          {fields.map((field, i) => {
            const isEditing = editingField === field.key;
            const value = formatValue(field, profile[field.key]);
            const justSaved = saveSuccess === field.key;

            return (
              <div
                key={field.key}
                className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isEditing
                    ? "border-primary/50 shadow-[0_0_20px_rgba(0,255,127,0.08)] bg-card-dark"
                    : justSaved
                      ? "border-primary/40 bg-card-dark"
                      : "border-card-border bg-card-dark hover:border-card-border/80"
                }`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(16px)",
                  transition: `opacity 0.5s ease ${0.2 + i * 0.06}s, transform 0.5s ease ${0.2 + i * 0.06}s, border-color 0.2s`,
                }}
              >
                {isEditing && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest">
                      <span
                        className={`transition-colors ${isEditing ? "text-primary" : "text-text-muted"}`}
                      >
                        {field.icon}
                      </span>
                      {field.label}
                    </label>
                    {field.editable && !isEditing && (
                      <button
                        onClick={() => startEdit(field)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10"
                        title={`Edit ${field.label}`}
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type={field.type}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={field.placeholder}
                        autoFocus
                        className="w-full bg-background-base border border-card-border rounded-xl px-4 py-2.5 text-text-light text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,127,0.06)] transition-all"
                      />
                      {error && <p className="text-red-400 text-xs">{error}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveField(field.key)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-background-dark rounded-lg text-xs font-bold hover:bg-primary-hover transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(0,255,127,0.2)]"
                        >
                          {saving ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          Simpan
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-background-base border border-card-border text-text-muted rounded-lg text-xs font-bold hover:text-text-light transition-all"
                        >
                          <X size={12} /> Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-between ${field.editable ? "cursor-pointer" : "cursor-default"}`}
                      onClick={() => field.editable && startEdit(field)}
                    >
                      {justSaved ? (
                        <span className="text-primary text-sm font-semibold flex items-center gap-1.5">
                          <Check size={14} /> Tersimpan!
                        </span>
                      ) : value ? (
                        <span className="text-text-light text-sm font-medium">
                          {value}
                        </span>
                      ) : (
                        <span className="text-text-muted/50 text-sm italic">
                          {field.editable
                            ? `Klik untuk mengisi ${field.label.toLowerCase()}`
                            : "—"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Ganti Password (hanya untuk akun manual, bukan pure Google) ── */}
        {hasPassword && (
          <div
            className="rounded-2xl border border-card-border bg-card-dark overflow-hidden mb-6"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.8s ease 0.5s",
            }}
          >
            <button
              onClick={() => {
                setShowPasswordForm((p) => !p);
                setPasswordError(null);
                setPasswordSuccess(false);
              }}
              className="w-full flex items-center justify-between px-5 py-4 text-left group hover:bg-background-base/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <KeyRound size={15} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-light">
                    Ubah Password
                  </p>
                  <p className="text-xs text-text-muted">
                    Perbarui password akun kamu
                  </p>
                </div>
              </div>
              <div
                className={`transition-transform duration-200 ${showPasswordForm ? "rotate-45" : ""}`}
              >
                <X
                  size={16}
                  className={`text-text-muted transition-opacity ${showPasswordForm ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}
                />
                {!showPasswordForm && (
                  <Edit3
                    size={16}
                    className="text-text-muted -mt-4 group-hover:text-primary transition-colors"
                  />
                )}
              </div>
            </button>

            {showPasswordForm && (
              <div className="px-5 pb-5 border-t border-card-border pt-4 space-y-3">
                {["current", "new", "confirm"].map((f) => (
                  <div key={f}>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1.5">
                      {f === "current"
                        ? "Password Saat Ini"
                        : f === "new"
                          ? "Password Baru"
                          : "Konfirmasi Password Baru"}
                    </label>
                    <input
                      type="password"
                      value={passwordForm[f as keyof typeof passwordForm]}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, [f]: e.target.value }))
                      }
                      placeholder={
                        f === "current"
                          ? "Masukkan password saat ini"
                          : f === "new"
                            ? "Minimal 8 karakter"
                            : "Ulangi password baru"
                      }
                      className="w-full bg-background-base border border-card-border rounded-xl px-4 py-2.5 text-text-light text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,127,0.06)] transition-all"
                    />
                  </div>
                ))}

                {passwordError && (
                  <p className="text-red-400 text-xs">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-primary text-xs flex items-center gap-1.5 font-semibold">
                    <Check size={13} /> Password berhasil diubah!
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handlePasswordChange}
                    disabled={passwordSaving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-primary text-background-dark rounded-lg text-xs font-bold hover:bg-primary-hover transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(0,255,127,0.2)]"
                  >
                    {passwordSaving ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    {passwordSaving ? "Menyimpan..." : "Simpan Password"}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({ current: "", new: "", confirm: "" });
                      setPasswordError(null);
                    }}
                    disabled={passwordSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-background-base border border-card-border text-text-muted rounded-lg text-xs font-bold hover:text-text-light transition-all"
                  >
                    <X size={12} /> Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className="text-center text-xs text-text-muted/50"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.8s ease 0.7s",
          }}
        >
          Klik pada field untuk mengedit langsung • Email tidak dapat diubah
        </div>
      </div>
    </div>
  );
}
