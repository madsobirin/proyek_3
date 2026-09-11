import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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

    // Hitung BMI
    const bmi = berat / Math.pow(tinggi / 100, 2);
    const bmiRounded = parseFloat(bmi.toFixed(1));

    // Tentukan status
    let status: string;
    if (bmi < 18.5) status = "Kurus";
    else if (bmi < 25) status = "Normal";
    else if (bmi < 30) status = "Berlebih";
    else status = "Obesitas";

    // Hitung BMR (Mifflin-St Jeor)
    let bmr =
      10 * berat + 6.25 * tinggi - 5 * age + (sex === "wanita" ? -161 : 5);
    bmr = Math.round(bmr);

    // Multiplier Aktivitas
    let multiplier = 1.55;
    if (activityKey === "rebahan" || activityKey === "sedentary")
      multiplier = 1.2;
    else if (activityKey === "ringan") multiplier = 1.375;
    else if (activityKey === "sedang") multiplier = 1.55;
    else if (activityKey === "berat") multiplier = 1.725;

    const tdee = Math.round(bmr * multiplier);

    // Target Kalori berdasarkan status BMI
    let target_kalori = tdee;
    let jenis_target = "Maintenance";
    if (status === "Berlebih" || status === "Obesitas") {
      target_kalori = Math.max(1200, tdee - 500);
      jenis_target = "Defisit Kalori (-500 kkal)";
    } else if (status === "Kurus") {
      target_kalori = tdee + 400;
      jenis_target = "Surplus Kalori (+400 kkal)";
    }

    // Simpan ke DB kalau user login
    const auth = await getAuthUser(request);
    if (auth?.userId) {
      await prisma.perhitungan.create({
        data: {
          user_id: auth.userId,
          tinggi_badan: tinggi,
          berat_badan: berat,
          bmi: bmiRounded,
          status,
          gender: sex,
          usia: age,
          aktivitas: activityKey,
          bmr,
          tdee,
          target_kalori,
        },
      });
    }

    return NextResponse.json(
      {
        bmi: bmiRounded,
        status,
        bmr,
        tdee,
        target_kalori,
        jenis_target,
        gender: sex,
        usia: age,
        aktivitas: activityKey,
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

    return NextResponse.json(history);
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
