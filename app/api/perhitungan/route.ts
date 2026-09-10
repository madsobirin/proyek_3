import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tinggi_badan, berat_badan } = body;

    if (!tinggi_badan || !berat_badan) {
      return NextResponse.json(
        { message: "Tinggi dan berat badan wajib diisi" },
        { status: 400 },
      );
    }

    const tinggi = parseFloat(tinggi_badan);
    const berat = parseFloat(berat_badan);

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
        },
      });
    }

    return NextResponse.json({ bmi: bmiRounded, status }, { status: 200 });
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
      return NextResponse.json({ message: "ID parameter missing" }, { status: 400 });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID parameter invalid" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.perhitungan.findFirst({
      where: { id, user_id: auth.userId },
    });

    if (!existing) {
      return NextResponse.json({ message: "Data tidak ditemukan" }, { status: 404 });
    }

    await prisma.perhitungan.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Riwayat berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("PERHITUNGAN_DELETE_ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

