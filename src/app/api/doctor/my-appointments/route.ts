import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
export async function POST(req: Request) {
  const auth = await requireRole(['DOCTOR', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { email } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const doctor = await prisma.doctor.findFirst({ 
      where: { userId: user.id },
      include: { user: true }
    });
    
    if (!doctor) return NextResponse.json({ message: "Doctor profile not found" }, { status: 404 });

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: { patient: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ appointments, doctor }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
