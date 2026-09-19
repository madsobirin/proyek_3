import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const history = await prisma.scanMakanan.findMany({
      where: { user_id: auth.userId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: history }, { status: 200 });
  } catch (error) {
    console.error("SCAN_MAKANAN_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal mengambil riwayat scan" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id") ?? "";
  if (!/^\d+$/.test(idParam)) {
    return NextResponse.json(
      { message: "Parameter id tidak valid" },
      { status: 400 },
    );
  }

  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json(
      { message: "Parameter id tidak valid" },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.scanMakanan.findFirst({
      where: { id, user_id: auth.userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Riwayat scan tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.scanMakanan.delete({ where: { id } });
    return NextResponse.json(
      { message: "Riwayat scan berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("SCAN_MAKANAN_DELETE_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menghapus riwayat scan" },
      { status: 500 },
    );
  }
}
