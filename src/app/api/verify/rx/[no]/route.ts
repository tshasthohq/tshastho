import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(req: Request, { params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;

  const [online, local] = await Promise.all([
    prisma.prescription.findFirst({
      where: { prescriptionNo: no },
      include: { items: true, patient: { select: { name: true } } },
    }),
    prisma.localPrescription.findFirst({
      where: { prescriptionNo: no },
      include: { localPatient: { select: { name: true } } },
    }),
  ]);

  const rx = online || local;
  if (!rx) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Prescription not found', 404);

  const patientName = (online as any)?.patient?.name || (local as any)?.localPatient?.name || '—';
  const maskedName = patientName.length > 3 ? patientName.slice(0, 3) + '***' : patientName;

  let doctorName = 'Doctor';
  if (online) {
    const doc = await prisma.doctor.findUnique({
      where: { id: online.doctorId || '' },
      include: { user: { select: { name: true } } },
    });
    doctorName = doc?.user?.name || online.doctorName || 'Doctor';
  } else if (local) {
    const doc = await prisma.doctor.findUnique({
      where: { id: local.doctorId },
      include: { user: { select: { name: true } } },
    });
    doctorName = doc?.user?.name || 'Doctor';
  }

  const itemsCount = (online as any)?.items?.length || ((local as any)?.items as any[])?.length || 0;

  return NextResponse.json({
    success: true,
    verification: {
      prescriptionNo: rx.prescriptionNo,
      doctorName,
      patientNameMasked: maskedName,
      issueDate: rx.createdAt,
      validUntil: (online as any)?.validUntil || null,
      status: (online as any)?.status || 'VERIFIED',
      itemsCount,
      verified: true,
    },
  });
}
