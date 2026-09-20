/*
  Warnings:

  - You are about to drop the `makanan` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "perhitungan" ADD COLUMN     "aktivitas" TEXT,
ADD COLUMN     "bmr" DOUBLE PRECISION,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "target_kalori" DOUBLE PRECISION,
ADD COLUMN     "tdee" DOUBLE PRECISION,
ADD COLUMN     "usia" INTEGER;

-- DropTable
DROP TABLE "makanan";
