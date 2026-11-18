const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching medicines from the pharmacy...");
  // যেকোনো একটি ফার্মেসির মেডিসিন থেকে ডাটা নেওয়া হচ্ছে
  const sourceMed = await prisma.medicine.findFirst();
  if (!sourceMed) {
    console.log("❌ No medicines found in the database to copy.");
    return;
  }

  const allMeds = await prisma.medicine.findMany({
    where: { pharmacyId: sourceMed.pharmacyId }
  });

  console.log(`Found ${allMeds.length} medicines. Syncing to Master Database...`);
  
  let count = 0;
  for (const med of allMeds) {
    // MasterMedicine-এ ডাটা ইনসার্ট করা (ডুপ্লিকেট হলে স্কিপ করবে)
    try {
      await prisma.masterMedicine.create({
        data: {
          name: med.name,
          brand: med.brand,
          genericName: med.genericName,
          category: med.category,
          strength: med.strength,
          manufacturer: med.manufacturer,
          imageUrl: med.images?.[0] || null,
          description: med.description,
          sellingPrice: med.sellingPrice
        }
      });
      count++;
    } catch (e) {
      // ডুপ্লিকেট হলে বাদ যাবে
    }
  }
  console.log(`✅ Successfully synced ${count} medicines to Master Database!`);
  
  // ভেরিফাই করা
  const totalMaster = await prisma.masterMedicine.count();
  console.log(`🎉 Total medicines in Master Database: ${totalMaster}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
