import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const today = new Date().toISOString().split("T")[0];

    const active = await prisma.attendance.findFirst({
      where: { userId: user.id, date: today, checkOutTime: null },
    });

    const completed = await prisma.attendance.findFirst({
      where: { userId: user.id, date: today, checkOutTime: { not: null } },
      orderBy: { checkInTime: "desc" },
    });

    return NextResponse.json({ 
      active, 
      completed,
      hasCheckedIn: !!(active || completed),
      isCheckedIn: !!active,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
