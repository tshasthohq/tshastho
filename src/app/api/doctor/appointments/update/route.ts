import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
export async function POST(req: Request) {
  const auth = await requireRole(['DOCTOR', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { appointmentId, status } = await req.json();

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    // রোগীর জন্য নোটিফিকেশন তৈরি করা
    const title = status === "CONFIRMED" 
      ? "✅ Appointment Confirmed!" 
      : status === "REJECTED" 
      ? "❌ Appointment Rejected" 
      : "📅 Appointment Update";

    const message = status === "CONFIRMED"
      ? `Dr. ${appointment.doctor.user.name} confirmed your appointment on ${appointment.date} at ${appointment.time}`
      : status === "REJECTED"
      ? `Dr. ${appointment.doctor.user.name} could not confirm your appointment. Please try another time.`
      : `Your appointment status has been updated to ${status}`;

    await prisma.notification.create({
      data: {
        userId: appointment.patientId,
        title,
        message,
        type: status.toLowerCase(),
        link: "/dashboard/appointments",
      },
    });

    return NextResponse.json({ message: "Updated successfully", appointment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
