import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { hitungAnalisisKesehatan } from "@/lib/kesehatan";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tinggi_badan,
      berat_badan,
      gender = "pria",
      usia = 25,
      aktivitas = "sedang",
    } = body;

    if (!tinggi_badan || !berat_badan) {
      return NextResponse.json(
        { message: "Tinggi dan berat badan wajib diisi" },
        { status: 400 },
      );
    }

    const tinggi = parseFloat(tinggi_badan);
    const berat = parseFloat(berat_badan);
    const age = parseInt(String(usia), 10) || 25;
    const sex = String(gender).toLowerCase() === "wanita" ? "wanita" : "pria";
    const activityKey = String(aktivitas).toLowerCase();

    if (isNaN(tinggi) || isNaN(berat) || tinggi <= 0 || berat <= 0) {
      return NextResponse.json(
        { message: "Data tidak valid" },
        { status: 400 },
      );
    }

    // Hitung Analisis Kesehatan & Nutrisi dengan presisi penuh
    const hasil = hitungAnalisisKesehatan({
      tinggi,
      berat,
      gender: sex,
      usia: age,
      aktivitas: activityKey,
    });

    // Simpan ke DB kalau user login (snapshot input dan hasil)
    const auth = await getAuthUser(request);
    if (auth?.userId) {
      await prisma.$transaction([
        prisma.perhitungan.create({
          data: {
            user_id: auth.userId,
            tinggi_badan: tinggi,
            berat_badan: berat,
            usia: age,
            gender: sex,
            aktivitas: activityKey,
            bmi: hasil.bmi,
            status: hasil.status,
            bmr: hasil.bmr,
            tdee: hasil.tdee,
            berat_min: hasil.berat_min,
            berat_max: hasil.berat_max,
            protein: hasil.protein,
            karbohidrat: hasil.karbohidrat,
            lemak: hasil.lemak,
          },
        }),
        // Otomatis sinkronkan profil user saat ini (snapshot riwayat tetap tidak berubah)
        prisma.account.update({
          where: { id: auth.userId },
          data: {
            weight: Math.round(berat),
            height: Math.round(tinggi),
          },
        }),
      ]);
    }

    return NextResponse.json(
      {
        bmi: hasil.bmi,
        status: hasil.status,
        bmr: hasil.bmr,
        tdee: hasil.tdee,
        berat_min: hasil.berat_min,
        berat_max: hasil.berat_max,
        protein: hasil.protein,
        lemak: hasil.lemak,
        karbohidrat: hasil.karbohidrat,
        gender: sex,
        usia: age,
        aktivitas: activityKey,
        tinggi_badan: tinggi,
        berat_badan: berat,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PERHITUNGAN_ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const history = await prisma.perhitungan.findMany({
      where: { user_id: auth.userId },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    // Pastikan seluruh riwayat memiliki snapshot nilai lengkap
    const formattedHistory = history.map((item) => {
      if (item.berat_min != null && item.protein != null && item.lemak != null && item.karbohidrat != null) {
        return item;
      }
      const calc = hitungAnalisisKesehatan({
        tinggi: item.tinggi_badan,
        berat: item.berat_badan,
        gender: item.gender ?? "pria",
        usia: item.usia ?? 25,
        aktivitas: item.aktivitas ?? "sedang",
      });
      return {
        ...item,
        berat_min: item.berat_min ?? calc.berat_min,
        berat_max: item.berat_max ?? calc.berat_max,
        protein: item.protein ?? calc.protein,
        lemak: item.lemak ?? calc.lemak,
        karbohidrat: item.karbohidrat ?? calc.karbohidrat,
        bmr: item.bmr ?? calc.bmr,
        tdee: item.tdee ?? calc.tdee,
      };
    });

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error("PERHITUNGAN_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json(
        { message: "ID parameter missing" },
        { status: 400 },
      );
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "ID parameter invalid" },
        { status: 400 },
      );
    }

    // Verify ownership
    const existing = await prisma.perhitungan.findFirst({
      where: { id, user_id: auth.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Data tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.perhitungan.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Riwayat berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("PERHITUNGAN_DELETE_ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
