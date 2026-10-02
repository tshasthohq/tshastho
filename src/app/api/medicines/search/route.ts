import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const where: any = { isActive: true, stock: { gt: 0 } };
    if (query && query.trim()) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { genericName: { contains: query, mode: "insensitive" } },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        pharmacy: {
          select: { id: true, shopName: true, address: true, area: true, city: true, deliveryRadius: true },
        },
      },
      take: 40,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ medicines }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
