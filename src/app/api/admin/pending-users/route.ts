import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ["DOCTOR", "PHARMACY_OWNER"] } },
      include: { doctorProfile: true, pharmacyProfile: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
