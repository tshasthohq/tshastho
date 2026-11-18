const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function syncInventory() {
  try {
    console.log("🚀 Starting Pharmacy Inventory Sync...");

    const pharmacy = await prisma.pharmacy.findFirst({ where: { shopName: { contains: "T Pharmacy", mode: "insensitive" } } });
    if (!pharmacy) return console.log("❌ Pharmacy not found.");

    const branch = await prisma.pharmacyBranch.findFirst({ where: { pharmacyId: pharmacy.id } });
    if (!branch) return console.log("❌ Branch not found.");

    const masterMeds = await prisma.masterMedicine.findMany();
    console.log(`📦 Found ${masterMeds.length} Master Medicines.`);

    const existingPharmacyMeds = await prisma.medicine.findMany({
      where: { pharmacyId: pharmacy.id },
      select: { name: true }
    });
    const existingMedsSet = new Set(existingPharmacyMeds.map(m => m.name.toLowerCase()));

    let count = 0;
    for (const master of masterMeds) {
      if (!existingMedsSet.has(master.name.toLowerCase())) {
        const newMed = await prisma.medicine.create({
          data: {
            pharmacyId: pharmacy.id,
            masterMedicineId: master.id,
            name: master.name,
            brand: master.brand,
            genericName: master.genericName,
            category: master.category,
            purchasePrice: 0, 
            sellingPrice: 0,
            stock: 0, // 🔥 স্টক ০
            unit: "piece",
            isActive: true
          }
        });

        await prisma.branchStock.create({
          data: {
            branchId: branch.id,
            medicineId: newMed.id,
            quantity: 0 // 🔥 স্টক ০
          }
        });
        existingMedsSet.add(master.name.toLowerCase());
        count++;
      }
    }

    console.log(`\n🎉 ALL DONE! Successfully synced ${count} medicines to Pharmacy Inventory with 0 Stock!`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncInventory();
