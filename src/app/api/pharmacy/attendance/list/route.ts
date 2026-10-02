import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, date } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const targetDate = date || new Date().toISOString().split("T")[0];

    const staffList = await prisma.user.findMany({
      where: { parentPharmacyId: pharmacy.id, role: "PHARMACY_STAFF" },
      select: { id: true, name: true, phone: true, staffRole: true, isActive: true },
    });

    const attendances = await prisma.attendance.findMany({
      where: { pharmacyId: pharmacy.id, date: targetDate },
      orderBy: { checkInTime: "desc" },
    });

    const records = staffList.map(s => {
      const att = attendances.find(a => a.userId === s.id);
      return {
        staff: s,
        attendance: att || null,
        status: att ? (att.checkOutTime ? "COMPLETED" : "WORKING") : "ABSENT",
      };
    });

    const presentCount = attendances.filter(a => !a.checkOutTime).length;
    const completedCount = attendances.filter(a => a.checkOutTime).length;
    const lateCount = attendances.filter(a => a.status === "LATE").length;
    const absentCount = staffList.length - attendances.length;

    return NextResponse.json({
      records,
      summary: {
        total: staffList.length,
        present: presentCount,
        completed: completedCount,
        late: lateCount,
        absent: absentCount,
      },
      date: targetDate,
    }, { status: 200 });
  } catch (error) {
    console.error("Attendance list error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
