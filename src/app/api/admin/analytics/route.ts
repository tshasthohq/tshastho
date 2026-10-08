import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // User counts by role
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalPharmacies,
      totalPendingUsers,
      totalApprovedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.user.count({ where: { role: "PHARMACY_OWNER" } }),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "APPROVED" } }),
    ]);

    // Order stats
    const allOrders = await prisma.order.findMany({
      select: {
        totalAmount: true,
        finalAmount: true,
        platformFee: true,
        netProfit: true,
        status: true,
        createdAt: true,
      },
    });

    let totalRevenue = 0;
    let totalPlatformEarnings = 0;
    let totalPharmacyProfit = 0;
    let todayRevenue = 0;
    let todayPlatformEarnings = 0;
    let monthRevenue = 0;
    let monthPlatformEarnings = 0;

    for (const o of allOrders) {
      const amount = parseFloat(o.totalAmount.toString());
      const fee = parseFloat(o.platformFee.toString());
      const profit = parseFloat(o.netProfit.toString());
      
      totalRevenue += amount;
      totalPlatformEarnings += fee;
      totalPharmacyProfit += profit;

      const created = new Date(o.createdAt);
      if (created >= todayStart) {
        todayRevenue += amount;
        todayPlatformEarnings += fee;
      }
      if (created >= monthStart) {
        monthRevenue += amount;
        monthPlatformEarnings += fee;
      }
    }

    // Order status counts
    const pendingOrders = allOrders.filter(o => o.status === "PENDING").length;
    const deliveredOrders = allOrders.filter(o => o.status === "DELIVERED").length;

    // Appointments
    const totalAppointments = await prisma.appointment.count();
    const pendingAppointments = await prisma.appointment.count({ where: { status: "REQUESTED" } });

    // Medicine stats
    const totalMedicines = await prisma.medicine.count();
    const totalMasterMedicines = await prisma.masterMedicine.count();

    // Dues
    const dues = await prisma.due.findMany({ where: { status: { not: "PAID" } } });
    let totalDue = 0;
    for (const d of dues) {
      totalDue += parseFloat(d.amount.toString()) - parseFloat(d.paidAmount.toString());
    }

    return NextResponse.json({
      users: { total: totalUsers, patients: totalPatients, doctors: totalDoctors, pharmacies: totalPharmacies, pending: totalPendingUsers, approved: totalApprovedUsers },
      orders: { total: allOrders.length, pending: pendingOrders, delivered: deliveredOrders },
      revenue: { total: totalRevenue, platformEarnings: totalPlatformEarnings, pharmacyProfit: totalPharmacyProfit, todayRevenue, todayPlatformEarnings, monthRevenue, monthPlatformEarnings },
      appointments: { total: totalAppointments, pending: pendingAppointments },
      medicines: { total: totalMedicines, masterCatalog: totalMasterMedicines },
      dues: { total: totalDue, count: dues.length },
    }, { status: 200 });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
