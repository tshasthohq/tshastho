import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
export async function GET() {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const charge = await prisma.systemSetting.findUnique({ where: { key: "delivery_charge" } });
    const free = await prisma.systemSetting.findUnique({ where: { key: "delivery_charge_free" } });
    const threshold = await prisma.systemSetting.findUnique({ where: { key: "free_delivery_threshold" } });

    return NextResponse.json({
      charge: charge ? parseFloat(charge.value) : 30,
      free: free ? free.value === "true" : false,
      threshold: threshold ? parseFloat(threshold.value) : 500,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
