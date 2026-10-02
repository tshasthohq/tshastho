import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const {
      email, staffId, month,
      basicSalary, presentDays, totalDays,
      attendanceAmount, commissionAmount,
      bonus, deduction, advanceDeducted, netPayable,
      paidAmount, paymentMethod, note,
      // Optional overrides
      customAttendanceAmount, customCommissionAmount,
      customDeduction, customNetPayable, isCustomized, editNote,
      workingDaysThisMonth, hoursPerDayUsed,
    } = await req.json();

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

    // Check existing
    const existing = await prisma.salaryPayment.findFirst({
      where: { staffId, pharmacyId: pharmacy.id, month },
    });

    const paymentData = {
      basicSalary: parseFloat(basicSalary) || 0,
      presentDays: parseInt(presentDays) || 0,
      totalDays: parseInt(totalDays) || 30,
      attendanceAmount: parseFloat(attendanceAmount) || 0,
      commissionAmount: parseFloat(commissionAmount) || 0,
      bonus: parseFloat(bonus) || 0,
      deduction: parseFloat(deduction) || 0,
      advanceDeducted: parseFloat(advanceDeducted) || 0,
      netPayable: parseFloat(netPayable) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      paymentMethod: paymentMethod || "CASH",
      note: note || null,
      customAttendanceAmount: customAttendanceAmount ? parseFloat(customAttendanceAmount) : null,
      customCommissionAmount: customCommissionAmount ? parseFloat(customCommissionAmount) : null,
      customDeduction: customDeduction ? parseFloat(customDeduction) : null,
      customNetPayable: customNetPayable ? parseFloat(customNetPayable) : null,
      isCustomized: !!isCustomized,
      editNote: editNote || null,
      workingDaysThisMonth: parseInt(workingDaysThisMonth) || 30,
      hoursPerDayUsed: parseInt(hoursPerDayUsed) || 8,
    };

    let payment;
    if (existing) {
      // Update
      payment = await prisma.salaryPayment.update({
        where: { id: existing.id },
        data: {
          ...paymentData,
          status: "PAID",
          paidAt: new Date(),
        },
      });
    } else {
      // Create
      payment = await prisma.salaryPayment.create({
        data: {
          staffId,
          pharmacyId: pharmacy.id,
          month,
          ...paymentData,
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    // Deduct advance if any
    if (paymentData.advanceDeducted > 0) {
      const advances = await prisma.staffAdvance.findMany({
        where: { staffId, pharmacyId: pharmacy.id, status: "PENDING" },
        orderBy: { createdAt: "asc" },
      });

      let remainingToDeduct = paymentData.advanceDeducted;
      for (const adv of advances) {
        if (remainingToDeduct <= 0) break;
        const advRemaining = parseFloat(adv.remainingAmount.toString());
        const deductFromThis = Math.min(advRemaining, remainingToDeduct);
        const newPaid = parseFloat(adv.paidAmount.toString()) + deductFromThis;
        const newRemaining = advRemaining - deductFromThis;
        remainingToDeduct -= deductFromThis;

        await prisma.staffAdvance.update({
          where: { id: adv.id },
          data: {
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newRemaining <= 0 ? "PAID" : "PENDING",
          },
        });
      }
    }

    // Notify staff
    await prisma.notification.create({
      data: {
        userId: staffId,
        title: "💰 Salary Paid!",
        message: `Your salary for ${month} has been paid: ৳${paymentData.paidAmount.toFixed(2)}`,
        type: "info",
      },
    });

    return NextResponse.json({ message: "Salary saved ✅", payment }, { status: 200 });
  } catch (error) {
    console.error("Salary save error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
