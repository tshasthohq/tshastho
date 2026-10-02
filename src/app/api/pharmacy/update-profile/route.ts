import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { pharmacyId, shopName, address, area, city, deliveryRadius, logo } = await req.json();

    const pharmacy = await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        shopName,
        address,
        area: area || null,
        city,
        deliveryRadius: parseInt(deliveryRadius) || 5,
        logo: logo || null,
      },
    });

    return NextResponse.json({ message: "Updated!", pharmacy }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
