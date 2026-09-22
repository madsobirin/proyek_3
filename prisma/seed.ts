import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { generateMenus } from "./factories/menuFactory";
import { generateArtikels } from "./factories/artikelFactory";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Mulai seeding...\n");
  // ── Bersihkan data lama ──
  console.log("🗑️  Menghapus data lama...");
  await prisma.artikel.deleteMany();
  await prisma.menu.deleteMany();
  console.log("✅ Data lama dihapus\n");

  // ── Seed Menu ──
  console.log("🍽️  Menyimpan 20 data menu...");
  const menus = generateMenus();
  for (const menu of menus) {
    await prisma.menu.create({ data: menu });
    console.log(
      `   ✓ ${menu.nama_menu} [${menu.target_status}] — ${menu.kalori} kkal`,
    );
  }
  console.log(`\n✅ ${menus.length} menu berhasil dibuat\n`);

  // ── Seed Artikel ──
  console.log("📰 Menyimpan 10 data artikel...");
  const artikels = generateArtikels();
  for (const artikel of artikels) {
    await prisma.artikel.create({ data: artikel });
    console.log(`   ✓ ${artikel.judul} [${artikel.kategori}]`);
  }
  console.log(`\n✅ ${artikels.length} artikel berhasil dibuat\n`);

  console.log("🎉 Seeding selesai!");
  console.log(`   Total: ${menus.length} menu + ${artikels.length} artikel`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
