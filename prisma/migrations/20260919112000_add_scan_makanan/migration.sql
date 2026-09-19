-- CreateTable
CREATE TABLE "scan_makanan" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "barcode" TEXT NOT NULL,
    "nama_makanan" TEXT NOT NULL,
    "brand" TEXT,
    "image_url" TEXT,
    "kalori" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "lemak" DOUBLE PRECISION,
    "karbohidrat" DOUBLE PRECISION,
    "gula" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_makanan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scan_makanan" ADD CONSTRAINT "scan_makanan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
