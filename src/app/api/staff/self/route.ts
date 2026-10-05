import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user!;

  const staff = await prisma.doctorStaff.findUnique({
    where: { userId: user.id },
    include: {
      doctor: {
        include: { user: { select: { id: true, name: true } } },
      },
      chamberAssignments: { include: { chamber: true } },
    },
  });

  if (!staff) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Not a staff member', 404);

  const today = todayStr();
  const todayAttendance = await prisma.staffAttendance.findFirst({
    where: { staffId: staff.id, date: today },
    orderBy: { checkInAt: 'desc' },
  });

  return NextResponse.json({ success: true, staff, todayAttendance });
}

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user!;

  const staff = await prisma.doctorStaff.findUnique({ where: { userId: user.id } });
  if (!staff) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Not a staff member', 404);

  const today = todayStr();
  const existing = await prisma.staffAttendance.findFirst({
    where: { staffId: staff.id, date: today, checkOutAt: null },
  });

  if (existing) {
    const updated = await prisma.staffAttendance.update({
      where: { id: existing.id },
      data: { checkOutAt: new Date() },
    });
    return NextResponse.json({ success: true, attendance: updated, action: 'CHECKOUT' });
  }

  const created = await prisma.staffAttendance.create({
    data: { staffId: staff.id, date: today },
  });
  return NextResponse.json({ success: true, attendance: created, action: 'CHECKIN' }, { status: 201 });
}
