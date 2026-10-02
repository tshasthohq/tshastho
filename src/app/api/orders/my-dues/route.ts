import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
        const user = await prisma.user.findFirst({ where: { email: auth.user.email }});
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const dues = await prisma.due.findMany({
      where: { patientId: user.id, status: { not: "PAID" } },
      include: {
        pharmacy: {
          include: { user: { select: { phone: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalDue = 0;
    for (const d of dues) {
      totalDue += parseFloat(d.amount.toString()) - parseFloat(d.paidAmount.toString());
    }

    return NextResponse.json({ dues, totalDue }, { status: 200 });
  } catch (error) {
    console.error("My-dues error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
