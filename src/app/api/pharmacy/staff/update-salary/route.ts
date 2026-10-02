import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { staffId, basicSalary, dailyRate, commissionPercent, requesterEmail } = await req.json();

    // Permission check
    if (requesterEmail) {
      const requester = await prisma.user.findFirst({ where: { email: requesterEmail } });
      if (requester && requester.role !== "PHARMACY_OWNER" && requester.role !== "SUPER_ADMIN") {
        const reqPerms = (requester.permissions as string[]) || [];
        if (!reqPerms.includes("manage_staff")) {
          return NextResponse.json({ message: "❌ No permission" }, { status: 403 });
        }
      }
    }

    const staff = await prisma.user.update({
      where: { id: staffId },
      data: {
        basicSalary: parseFloat(basicSalary) || 0,
        dailyRate: parseFloat(dailyRate) || 0,
        commissionPercent: parseFloat(commissionPercent) || 0,
      },
    });

    return NextResponse.json({ message: "Salary updated ✅", staff }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
