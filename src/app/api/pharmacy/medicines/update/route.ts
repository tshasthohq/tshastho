import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { medicineId, action } = body;

    if (action === "delete") {
      await prisma.medicine.delete({ where: { id: medicineId } });
      return NextResponse.json({ message: "Deleted!" }, { status: 200 });
    }

    const medicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        name: body.name,
        brand: body.brand || null,
        genericName: body.genericName || null,
        category: body.category || null,
        description: body.description || null,
        purchasePrice: parseFloat(body.purchasePrice),
        sellingPrice: parseFloat(body.sellingPrice),
        discountPercent: parseFloat(body.discountPercent) || 0,
        stock: parseInt(body.stock),
        unit: body.unit || "piece",
        manufacturer: body.manufacturer || null,
        masterMedicineId: body.masterMedicineId || null,
        images: Array.isArray(body.images) ? body.images : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        batchNumber: body.batchNumber || null,
      },
    });

    return NextResponse.json({ message: "Updated!", medicine }, { status: 200 });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
