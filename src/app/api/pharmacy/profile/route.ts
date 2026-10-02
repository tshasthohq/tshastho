import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) {
      pharmacy = await prisma.pharmacy.findFirst({
        where: { id: user.parentPharmacyId },
        include: { user: true },
      });
    }
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.findFirst({
        where: { userId: user.id },
        include: { user: true },
      });
    }

    return NextResponse.json({ pharmacy }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
