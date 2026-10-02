import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { email, staffId, month } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    }
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    }
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const staff = await prisma.user.findUnique({ where: { id: staffId } });
    if (!staff) return NextResponse.json({ message: "Staff not found" }, { status: 404 });

    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const startDate = targetMonth + "-01";
    const endDate = targetMonth + "-31";

    // Attendance data
    const attendances = await prisma.attendance.findMany({
      where: {
        userId: staffId,
        pharmacyId: pharmacy.id,
        date: { gte: startDate, lte: endDate },
      },
    });

    const presentDays = attendances.filter(a => a.status !== "ABSENT").length;
    const lateDays = attendances.filter(a => a.status === "LATE").length;

    // Calculate total hours from attendance
    let totalHoursWorked = 0;
    for (const a of attendances) {
      if (a.totalHours) {
        totalHoursWorked += parseFloat(a.totalHours.toString());
      }
    }

    // Days in month
    const [year, mon] = targetMonth.split("-");
    const daysInMonth = new Date(parseInt(year), parseInt(mon), 0).getDate();

    // Orders for commission
    const orders = await prisma.order.findMany({
      where: {
        pharmacyId: pharmacy.id,
        status: "DELIVERED",
        createdAt: { gte: new Date(startDate), lte: new Date(endDate + "T23:59:59") },
      },
      select: { id: true, totalAmount: true, netProfit: true },
    });

    const commissionPercent = parseFloat(staff.commissionPercent?.toString() || "0");
    let commissionBase = 0;
    for (const o of orders) {
      commissionBase += parseFloat(o.totalAmount.toString());
    }
    const commissionAmount = (commissionBase * commissionPercent) / 100;

    // Salary values from staff
    const basicSalary = parseFloat(staff.basicSalary?.toString() || "0");
    const dailyRate = parseFloat(staff.dailyRate?.toString() || "0");
    const salaryType = staff.salaryType || "MONTHLY";
    const workingDaysPerMonth = staff.workingDaysPerMonth || 30;
    const hoursPerDay = staff.hoursPerDay || 8;

    // ============ CALCULATION BY TYPE ============
    let attendanceAmount = 0;
    let calculationBreakdown: any = {};

    if (salaryType === "MONTHLY") {
      // Basic ÷ Working Days × Present Days
      const perDayRate = basicSalary > 0 ? (basicSalary / workingDaysPerMonth) : 0;
      const perHourRate = perDayRate > 0 && hoursPerDay > 0 ? (perDayRate / hoursPerDay) : 0;
      const expectedDays = workingDaysPerMonth;
      const absentDays = Math.max(0, expectedDays - presentDays);
      const absentDeduction = absentDays * perDayRate;
      
      attendanceAmount = basicSalary - absentDeduction;
      if (attendanceAmount < 0) attendanceAmount = 0;

      calculationBreakdown = {
        type: "MONTHLY",
        basicSalary,
        workingDaysPerMonth,
        hoursPerDay,
        perDayRate: perDayRate.toFixed(2),
        perHourRate: perHourRate.toFixed(2),
        expectedDays,
        presentDays,
        absentDays,
        absentDeduction: absentDeduction.toFixed(2),
      };
    } 
    else if (salaryType === "DAILY") {
      // Daily Rate × Present Days
      attendanceAmount = dailyRate * presentDays;
      
      calculationBreakdown = {
        type: "DAILY",
        dailyRate,
        presentDays,
        totalAmount: attendanceAmount.toFixed(2),
      };
    } 
    else if (salaryType === "HOURLY") {
      // Hourly Rate × Total Hours Worked
      // Hourly rate = Daily Rate ÷ Hours/Day (if daily rate set)
      const hourlyRate = dailyRate > 0 && hoursPerDay > 0 ? (dailyRate / hoursPerDay) : 0;
      const targetHours = workingDaysPerMonth * hoursPerDay;
      attendanceAmount = hourlyRate * totalHoursWorked;
      
      calculationBreakdown = {
        type: "HOURLY",
        hourlyRate: hourlyRate.toFixed(2),
        hoursPerDay,
        totalHoursWorked: totalHoursWorked.toFixed(2),
        targetHours,
        totalAmount: attendanceAmount.toFixed(2),
      };
    } 
    else if (salaryType === "CUSTOM") {
      // Manual - default uses basic salary as-is
      attendanceAmount = basicSalary;
      
      calculationBreakdown = {
        type: "CUSTOM",
        baseAmount: basicSalary,
        note: "Owner can override all values",
      };
    }

    // Advances
    const advances = await prisma.staffAdvance.findMany({
      where: {
        staffId,
        pharmacyId: pharmacy.id,
        status: "PENDING",
      },
    });
    const totalAdvance = advances.reduce((sum, a) => sum + parseFloat(a.remainingAmount.toString()), 0);

    const grossSalary = attendanceAmount + commissionAmount;
    const netPayable = Math.max(0, grossSalary - totalAdvance);

    // Existing payment for this month
    const existingPayment = await prisma.salaryPayment.findFirst({
      where: { staffId, pharmacyId: pharmacy.id, month: targetMonth },
    });

    return NextResponse.json({
      staff: {
        id: staff.id,
        name: staff.name,
        staffRole: staff.staffRole,
        basicSalary,
        dailyRate,
        commissionPercent,
        salaryType,
        workingDaysPerMonth,
        hoursPerDay,
      },
      month: targetMonth,
      presentDays,
      lateDays,
      totalDays: daysInMonth,
      totalHoursWorked: parseFloat(totalHoursWorked.toFixed(2)),
      attendanceAmount: parseFloat(attendanceAmount.toFixed(2)),
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      commissionBase: parseFloat(commissionBase.toFixed(2)),
      totalAdvance,
      advances: advances.length,
      grossSalary: parseFloat(grossSalary.toFixed(2)),
      netPayable: parseFloat(netPayable.toFixed(2)),
      orderCount: orders.length,
      calculationBreakdown,
      existingPayment,
    }, { status: 200 });
  } catch (error) {
    console.error("Salary calc error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
