import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, lat, lng, selfie } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const today = new Date().toISOString().split("T")[0];

    const attendance = await prisma.attendance.findFirst({
      where: { userId: user.id, date: today, checkOutTime: null },
      orderBy: { checkInTime: "desc" },
    });

    if (!attendance) return NextResponse.json({ message: "No active check-in" }, { status: 404 });

    const now = new Date();
    const checkIn = new Date(attendance.checkInTime);
    const hours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: now,
        checkOutLat: lat || null,
        checkOutLng: lng || null,
        checkOutSelfie: selfie || null,
        totalHours: hours.toFixed(2),
      },
    });

    return NextResponse.json({ 
      message: "Checked out ✅", 
      attendance: updated,
      totalHours: hours.toFixed(2),
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
