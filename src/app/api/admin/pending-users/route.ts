import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ["DOCTOR", "PHARMACY_OWNER"] } },
      include: { doctorProfile: true, pharmacyProfile: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
