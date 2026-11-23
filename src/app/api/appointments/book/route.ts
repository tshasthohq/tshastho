import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPush } from '@/lib/push';
import { requireAuth } from '@/lib/auth/guards';
import { isSlotAvailable } from '@/lib/doctor/schedule';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';

const schema = z.object({
  doctorId: z.string().min(1),
  date: z.string().min(8),
  time: z.string().min(4),
  slotType: z.string().optional(),
  fee: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(['WALLET', 'CASH']).default('WALLET'),
  scheduleId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // 1. Verify doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { id: data.doctorId } });
    if (!doctor) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Doctor not found', 404);
    if (doctor.claimStatus !== 'CLAIMED' || !doctor.userId) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'This doctor is not available for online booking yet', 400);
    }

    // 2. Check slot availability
    const sched = data.scheduleId ? await prisma.doctorSchedule.findUnique({ where: { id: data.scheduleId } }) : null;
    const isSerial = !!sched && sched.doctorId === data.doctorId && sched.bookingMode === 'SERIAL';
    const available = await isSlotAvailable(data.doctorId, data.date, data.time, data.scheduleId);
    if (!available) return errorResponse(ErrorCodes.CONFLICT, 'This slot is no longer available', 409);

    // 3. Prevent duplicate booking
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        patientId: user.id,
        date: data.date,
        ...(isSerial ? { scheduleId: data.scheduleId } : { time: data.time }),
        status: { in: ['REQUESTED', 'CONFIRMED', 'PATIENT_CONFIRMED', 'RESCHEDULED'] },
      },
    });
    if (existing) return errorResponse(ErrorCodes.CONFLICT, 'You already booked this slot', 409);

    const fee = Number(data.fee) || Number(doctor.consultationFee) || 0;
    let paymentStatus = 'UNPAID';

    // 4. Create Appointment & handle Payment in a Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Handle Wallet Payment
      if (data.paymentMethod === 'WALLET' || data.slotType === 'ONLINE') {
        const wallet = await tx.walletAccount.findUnique({ where: { userId: user.id } });
        if (!wallet || Number(wallet.balance) < fee) {
          throw new Error('Insufficient wallet balance. Please top up or choose Cash.');
        }

        // Deduct wallet
        await tx.walletAccount.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: fee },
            availableBalance: { decrement: fee },
            totalSpent: { increment: fee },
          },
        });

        // Create Wallet Transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'APPOINTMENT',
            direction: 'DEBIT',
            amount: fee,
            balanceBefore: Number(wallet.balance),
            balanceAfter: Number(wallet.balance) - fee,
            vertical: 'DOCTOR',
            description: `Appointment booking with Dr. ${doctor.specialty}`,
          },
        });
        paymentStatus = 'PAID';
      }

      // Create Appointment
      let serialInfo: { serialNo: number; scheduleId: string; time: string } | null = null;
      if (isSerial && sched) {
        const agg = await tx.appointment.aggregate({
          where: { doctorId: data.doctorId, date: data.date, scheduleId: sched.id },
          _max: { serialNo: true },
        });
        const serialNo = (agg._max.serialNo || 0) + 1;
        const sm = sched.startTime.split(':').map(Number);
        const dur = Number(sched.slotDuration) || 10;
        const mins = sm[0] * 60 + sm[1] + (serialNo - 1) * dur;
        const hh = String(Math.floor(mins / 60) % 24).padStart(2, '0');
        const mm = String(mins % 60).padStart(2, '0');
        serialInfo = { serialNo, scheduleId: sched.id, time: hh + ':' + mm };
      }
      const appointment = await tx.appointment.create({
        data: {
          patientId: user.id,
          doctorId: data.doctorId,
          date: data.date,
          time: serialInfo ? serialInfo.time : data.time,
          ...(serialInfo ? { serialNo: serialInfo.serialNo, scheduleId: serialInfo.scheduleId, source: 'ONLINE' } : {}),
          slotType: data.slotType,
          consultationFee: fee,
          paymentStatus: paymentStatus,
          status: 'REQUESTED',
          patientNotes: data.notes,
        },
      });

      // Create Telemedicine Session if slot type is ONLINE
      if (data.slotType === 'ONLINE') {
        await tx.telemedicineSession.create({
          data: {
            appointmentId: appointment.id,
            doctorId: doctor.id,
            patientId: user.id,
            roomId: 'tsh-' + crypto.randomBytes(8).toString('hex'),
            type: 'VIDEO',
            status: 'SCHEDULED',
            scheduledAt: new Date(`${data.date}T${serialInfo ? serialInfo.time : data.time}:00+06:00`),
          }
        });
      }
  

      // Create Doctor Earning (Status PENDING initially)
      await tx.doctorEarning.create({
        data: {
          doctorId: doctor.id,
          appointmentId: appointment.id,
          patientId: user.id,
          grossAmount: fee,
          netAmount: fee, // You can add platform fee logic here later
          status: 'PENDING' as any,
        },
      });

      // Notify doctor
      if (doctor.userId) await tx.notification.create({
        data: {
          userId: doctor.userId!,
          title: 'New Appointment Request',
          message: `New appointment on ${data.date} at ${data.time}`,
          type: 'info',
          link: '/doctor',
        },
      });

      return appointment;
    });

    // APPT_BOOK_PUSH: transaction commit hobar por doctor-ke push
    try {
      const docUser = await prisma.doctor.findUnique({ where: { id: String(data.doctorId) }, select: { userId: true } });
      if (docUser?.userId) {
        void sendPush(docUser.userId, {
          title: 'New Appointment Request',
          body: `New appointment on ${data.date} at ${data.time}`,
          url: '/doctor',
        });
      }
    } catch (e) { console.error('[APPT_BOOK_PUSH]', e); }

    return NextResponse.json({ success: true, appointment: result }, { status: 201 });

  } catch (error: any) {
    if (error?.code === 'P2002') {
      return errorResponse(ErrorCodes.CONFLICT, 'Someone just took that serial. Please try again.', 409);
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    if (error.message === 'Insufficient wallet balance. Please top up or choose Cash.') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.message, 400);
    }
    console.error('[BOOKING_ERROR]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Booking failed', 500);
  }
}
