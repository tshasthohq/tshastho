import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { getDoctorContext } from '@/lib/auth/doctor-context';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole(['DOCTOR']);
  if (auth.error) return auth.error;
  const doctor = await getDoctorContext(auth.user!);
  if (!doctor) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Doctor not found', 404);
  const r = await prisma.doctorVisit.deleteMany({ where: { id, doctorId: doctor.id } });
  if (r.count === 0) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Visit not found', 404);
  return NextResponse.json({ success: true });
}
