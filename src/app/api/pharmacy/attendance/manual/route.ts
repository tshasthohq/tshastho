import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { email, staffId, date, checkInTime, checkOutTime, status, note } = await req.json();

    const requester = await prisma.user.findFirst({ where: { email } });
    if (requester && requester.role !== "PHARMACY_OWNER" && requester.role !== "SUPER_ADMIN") {
      const reqPerms = (requester.permissions as string[]) || [];
      if (!reqPerms.includes("manage_staff") && !reqPerms.includes("view_attendance")) {
        return NextResponse.json({ message: "❌ No permission for manual entry" }, { status: 403 });
      }
    }
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    // Check duplicate
    const existing = await prisma.attendance.findFirst({
      where: { userId: staffId, date },
    });
    if (existing) {
      await prisma.attendance.delete({ where: { id: existing.id } });
    }

    // Combine date + time
    const checkInDateTime = new Date(date + "T" + checkInTime + ":00");
    let checkOutDateTime = null;
    let totalHours: any = null;

    if (checkOutTime) {
      checkOutDateTime = new Date(date + "T" + checkOutTime + ":00");
      const hrs = (checkOutDateTime.getTime() - checkInDateTime.getTime()) / (1000 * 60 * 60);
      totalHours = hrs.toFixed(2);
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: staffId,
        pharmacyId: pharmacy.id,
        date,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        totalHours,
        status: status || "PRESENT",
        note: note || null,
      },
    });

    return NextResponse.json({ message: "Manual entry saved ✅", attendance }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
