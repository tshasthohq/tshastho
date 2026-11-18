import { requireRole } from "@/lib/auth/guards";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const branchId = body.branchId;
    const page = body.page || 1;
    const limit = body.limit || 20;
    const search = body.search || "";

    // এক কোয়েরিতেই ফার্মেসি বের করা (সুপারফাস্ট)
    const pharmacy = await prisma.pharmacy.findFirst({
      where: {
        OR: [
          { userId: auth.user.id },
          { id: auth.user.parentPharmacyId || '' }
        ]
      }
    });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const whereClause = {
      pharmacyId: pharmacy.id,
      ...(search ? {
        OR: [
          { name: { startsWith: search, mode: 'insensitive' as const } },
          { brand: { startsWith: search, mode: 'insensitive' as const } },
          { genericName: { startsWith: search, mode: 'insensitive' as const } }
        ]
      } : {})
    };

    const [medicines, totalItems] = await Promise.all([
      prisma.medicine.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { name: "asc" },
      }),
      prisma.medicine.count({ where: whereClause })
    ]);

    let mappedMedicines = medicines;

    if (branchId && medicines.length > 0) {
      const medicineIds = medicines.map(m => m.id);
      if (branchId === "ALL") {
        const allStocks = await prisma.branchStock.groupBy({
          by: ['medicineId'],
          where: { medicineId: { in: medicineIds } },
          _sum: { quantity: true }
        });
        const stockMap = new Map(allStocks.map(s => [s.medicineId, s._sum.quantity || 0]));
        mappedMedicines = medicines.map(m => ({ ...m, stock: stockMap.get(m.id) || 0 }));
      } else {
        const branchStocks = await prisma.branchStock.findMany({
          where: { branchId: branchId, medicineId: { in: medicineIds } }
        });
        const stockMap = new Map(branchStocks.map(s => [s.medicineId, s.quantity || 0]));
        mappedMedicines = medicines.map(m => ({ ...m, stock: stockMap.get(m.id) || 0 }));
      }
    }

    return NextResponse.json({
      success: true,
      medicines: mappedMedicines,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) }
    });

  } catch (error) {
    console.error("Medicines API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
