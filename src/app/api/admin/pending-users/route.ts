import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const rawUsers = await prisma.user.findMany({
      where: { role: { in: ["DOCTOR", "PHARMACY_OWNER", "DIAGNOSTIC_OWNER", "BLOOD_BANK_OWNER"] } },
      include: { doctorProfile: true, pharmacyProfile: true, diagnostic: true, bloodBank: true },
      orderBy: { createdAt: "desc" },
    });
    const users = rawUsers.map(({ password, ...safe }: any) => safe);
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_PENDING_USERS_ERROR]', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
