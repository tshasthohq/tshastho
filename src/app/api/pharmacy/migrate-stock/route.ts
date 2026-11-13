import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pharmacies = await prisma.pharmacy.findMany();
    let migratedCount = 0;

    for (const pharmacy of pharmacies) {
      // Find Main Branch
      const mainBranch = await prisma.pharmacyBranch.findFirst({
        where: { pharmacyId: pharmacy.id },
        orderBy: { createdAt: 'asc' }
      });

      if (!mainBranch) continue;

      const medicines = await prisma.medicine.findMany({
        where: { pharmacyId: pharmacy.id }
      });

      for (const med of medicines) {
        await prisma.branchStock.upsert({
          where: { branchId_medicineId: { branchId: mainBranch.id, medicineId: med.id } },
          update: { quantity: med.stock }, // Update if exists
          create: { branchId: mainBranch.id, medicineId: med.id, quantity: med.stock } // Create if not
        });
        migratedCount++;
      }
    }

    return NextResponse.json({ message: `Successfully migrated ${migratedCount} medicines to Main Branch BranchStock.` });
  } catch (error: any) {
    return NextResponse.json({ message: "Error", error: error.message }, { status: 500 });
  }
}
