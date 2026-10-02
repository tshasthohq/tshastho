import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, staffId, month } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    // Month format: "2026-09"
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const startDate = targetMonth + "-01";
    const endDate = targetMonth + "-31";

    const where: any = {
      pharmacyId: pharmacy.id,
      date: { gte: startDate, lte: endDate },
    };
    if (staffId) where.userId = staffId;

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { checkInTime: "asc" },
    });

    // Get all staff
    const staffList = await prisma.user.findMany({
      where: { parentPharmacyId: pharmacy.id, role: "PHARMACY_STAFF" },
      select: { id: true, name: true, staffRole: true },
    });

    // Group by staff
    const byStaff: any = {};
    for (const s of staffList) {
      byStaff[s.id] = {
        staff: s,
        present: 0,
        late: 0,
        absent: 0,
        totalHours: 0,
        days: [],
      };
    }

    for (const att of attendances) {
      if (!byStaff[att.userId]) continue;
      if (att.status === "LATE") byStaff[att.userId].late++;
      else byStaff[att.userId].present++;
      if (att.totalHours) byStaff[att.userId].totalHours += parseFloat(att.totalHours.toString());
      byStaff[att.userId].days.push({
        date: att.date,
        checkIn: att.checkInTime,
        checkOut: att.checkOutTime,
        hours: att.totalHours,
        status: att.status,
      });
    }

    // Count working days in month
    const [year, mon] = targetMonth.split("-");
    const daysInMonth = new Date(parseInt(year), parseInt(mon), 0).getDate();

    for (const sid of Object.keys(byStaff)) {
      byStaff[sid].absent = daysInMonth - (byStaff[sid].present + byStaff[sid].late);
      byStaff[sid].workingDays = daysInMonth;
    }

    return NextResponse.json({
      report: Object.values(byStaff),
      month: targetMonth,
      workingDays: daysInMonth,
    }, { status: 200 });
  } catch (error) {
    console.error("Monthly report error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
