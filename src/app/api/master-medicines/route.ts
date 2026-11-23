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
      take: 300,
      orderBy: { name: "asc" },
    });

    const q = String(query || "").trim().toLowerCase();
    const rank = (m: any) => {
      const n = (m.name || "").toLowerCase();
      const b = (m.brand || "").toLowerCase();
      if (n.startsWith(q) || b.startsWith(q)) return 0;
      if (n.includes(q) || b.includes(q)) return 1;
      return 2;
    };
    const ranked = q
      ? [...medicines].sort((x: any, y: any) => rank(x) - rank(y) || x.name.localeCompare(y.name)).slice(0, 40)
      : medicines;
    return NextResponse.json({ medicines: ranked }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
