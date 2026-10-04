import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = (formData.get("image") ?? formData.get("photo")) as File | null;
    if (!file) {
      return NextResponse.json(
        { message: "File gambar tidak ditemukan" },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Tipe file tidak didukung (harus JPG, PNG, atau WEBP)" },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "Ukuran file maksimal 5MB" },
        { status: 400 },
      );
    }

    // Convert file ke base64
    const bytes = await file.arrayBuffer();
    const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;

    // Upload ke Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder: "fitlife/foods",
      public_id: `food_${Date.now()}_${auth.userId}`,
      transformation: [
        { width: 1024, height: 1024, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    return NextResponse.json(
      {
        message: "Foto produk berhasil diunggah",
        url: result.secure_url,
        image_url: result.secure_url,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("FOOD_UPLOAD_ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
