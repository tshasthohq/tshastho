import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, cartItems } = body; 

    if (!address || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ success: false, message: "Address and items are required" }, { status: 400 });
    }

    // অ্যাড্রেস থেকে শহরের নাম বের করার চেষ্টা (যেমন: "House 12, Dhanmondi, Dhaka" -> "Dhaka")
    const addressParts = address.split(",");
    const possibleCity = addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : address.trim();

    // ওই শহরে থাকা ব্রাঞ্চগুলো খোঁজা
    const branches = await prisma.pharmacyBranch.findMany({
      where: {
        OR: [
          { city: { contains: possibleCity, mode: 'insensitive' } },
          { area: { contains: possibleCity, mode: 'insensitive' } }
        ],
        isActive: true
      },
      include: {
        pharmacy: true
      }
    });

    if (branches.length === 0) {
      return NextResponse.json({ success: false, message: "No pharmacies found in your area" });
    }

    // প্রতিটি ব্রাঞ্চের স্টক চেক করা
    const medicineIds = cartItems.map((item: any) => item.medicineId);
    let bestBranch = null;
    let maxItemsFound = 0;

    for (const branch of branches) {
      const availableMeds = await prisma.medicine.count({
        where: {
          pharmacyId: branch.pharmacyId,
          id: { in: medicineIds },
          stock: { gt: 0 }
        }
      });

      if (availableMeds > maxItemsFound) {
        maxItemsFound = availableMeds;
        bestBranch = branch;
      }
    }

    if (bestBranch) {
      return NextResponse.json({
        success: true,
        branchId: bestBranch.id,
        branchName: bestBranch.name,
        pharmacyName: bestBranch.pharmacy.shopName,
        availableItems: maxItemsFound,
        totalItems: cartItems.length
      });
    }

    return NextResponse.json({ success: false, message: "No suitable branch found." });
  } catch (error) {
    console.error("Smart Route Error:", error);
    return NextResponse.json({ success: false, message: "Failed to auto-route order" }, { status: 500 });
  }
}
