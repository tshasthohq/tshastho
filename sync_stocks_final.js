const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Syncing all BranchStock to Medicine.stock for accurate caching...");
  const medicines = await prisma.medicine.findMany({ include: { branchStocks: true } });
  
  for (const med of medicines) {
    const totalStock = med.branchStocks.reduce((sum, bs) => sum + bs.quantity, 0);
    await prisma.medicine.update({
      where: { id: med.id },
      data: { stock: totalStock }
    });
  }
  console.log("✅ All stocks synced perfectly!");
}
main().finally(() => prisma.$disconnect());
