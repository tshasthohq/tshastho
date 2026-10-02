import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const where = query && query.trim() ? {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { brand: { contains: query, mode: "insensitive" as const } },
        { genericName: { contains: query, mode: "insensitive" as const } },
        { manufacturer: { contains: query, mode: "insensitive" as const } },
      ],
    } : {};

    const medicines = await prisma.masterMedicine.findMany({
      where,
      take: 40,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ medicines }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
