import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { patientEmail, doctorId, date, time } = await req.json();

    const patient = await prisma.user.findFirst({ where: { email: patientEmail } });
    if (!patient) return NextResponse.json({ message: "Patient not found" }, { status: 404 });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctorId,
        date: date,
        time: time,
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Appointment booked successfully! 🚀", appointment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error booking", error: String(error) }, { status: 500 });
  }
}
