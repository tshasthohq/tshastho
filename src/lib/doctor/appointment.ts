import { prisma } from '@/lib/prisma';

export type AppointmentAction =
  | 'CONFIRM'
  | 'PATIENT_CONFIRM'
  | 'RESCHEDULE'
  | 'CANCEL'
  | 'COMPLETE'
  | 'NO_SHOW';

interface ChangeParams {
  appointmentId: string;
  userId: string;
  action: AppointmentAction;
  reason?: string;
  newDate?: string;
  newTime?: string;
  notes?: string;
}

async function logStatusChange(
  appointmentId: string,
  fromStatus: string | null,
  toStatus: string,
  userId: string,
  reason?: string
) {
  await prisma.appointmentStatusHistory.create({
    data: {
      appointmentId,
      fromStatus,
      toStatus,
      changedById: userId,
      reason: reason || null,
    },
  });
}

export async function changeAppointmentStatus(params: ChangeParams) {
  const { appointmentId, userId, action, reason, newDate, newTime, notes } = params;

  const apt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true },
  });
  if (!apt) throw new Error('Appointment not found');

  const current = apt.status as string;
  let updateData: any = {};
  let toStatus = current;
  let notifyUserId: string | null = null;
  let notifyTitle = '';
  let notifyMsg = '';

  // Determine if user is doctor or patient
  const doctor = await prisma.doctor.findFirst({ where: { userId } });
  const isDoctor = doctor && doctor.id === apt.doctorId;
  const isPatient = apt.patientId === userId;

  if (!isDoctor && !isPatient) throw new Error('Not authorized for this appointment');

  switch (action) {
    case 'CONFIRM':
      if (!isDoctor) throw new Error('Only doctor can confirm');
      if (current !== 'REQUESTED' && current !== 'RESCHEDULED') throw new Error('Invalid state');
      updateData = { status: 'CONFIRMED', doctorConfirmedAt: new Date() };
      toStatus = 'CONFIRMED';
      notifyUserId = apt.patientId;
      notifyTitle = 'Appointment Confirmed';
      notifyMsg = `Your appointment on ${apt.date} at ${apt.time} has been confirmed.`;
      break;

    case 'PATIENT_CONFIRM':
      if (!isPatient) throw new Error('Only patient can confirm');
      if (current !== 'CONFIRMED') throw new Error('Invalid state');
      updateData = { status: 'PATIENT_CONFIRMED', patientConfirmedAt: new Date() };
      toStatus = 'PATIENT_CONFIRMED';
      notifyUserId = apt.doctor.userId;
      notifyTitle = 'Patient Confirmed';
      notifyMsg = `Patient confirmed appointment on ${apt.date} at ${apt.time}.`;
      break;

    case 'RESCHEDULE':
      if (!newDate || !newTime) throw new Error('New date and time required');
      updateData = {
        status: 'RESCHEDULED',
        previousDate: apt.date,
        previousTime: apt.time,
        date: newDate,
        time: newTime,
        rescheduledAt: new Date(),
        rescheduledById: userId,
        rescheduleReason: reason || null,
      };
      toStatus = 'RESCHEDULED';
      notifyUserId = isDoctor ? apt.patientId : apt.doctor.userId;
      notifyTitle = 'Appointment Rescheduled';
      notifyMsg = `Appointment moved from ${apt.date} ${apt.time} to ${newDate} ${newTime}.`;
      break;

    case 'CANCEL':
      if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(current)) throw new Error('Cannot cancel');
      updateData = {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: userId,
        cancelledBy: isDoctor ? 'DOCTOR' : 'PATIENT',
        cancelReason: reason || null,
      };
      toStatus = 'CANCELLED';
      notifyUserId = isDoctor ? apt.patientId : apt.doctor.userId;
      notifyTitle = 'Appointment Cancelled';
      notifyMsg = `Appointment on ${apt.date} ${apt.time} was cancelled.`;
      break;

    case 'COMPLETE':
      if (!isDoctor) throw new Error('Only doctor can complete');
      if (!['CONFIRMED', 'PATIENT_CONFIRMED', 'RESCHEDULED'].includes(current)) throw new Error('Invalid state');
      updateData = {
        status: 'COMPLETED',
        completedAt: new Date(),
        consultationNotes: notes || null,
      };
      toStatus = 'COMPLETED';
      notifyUserId = apt.patientId;
      notifyTitle = 'Appointment Completed';
      notifyMsg = `Your appointment has been marked completed.`;
      break;

    case 'NO_SHOW':
      if (!isDoctor) throw new Error('Only doctor can mark no-show');
      updateData = { status: 'NO_SHOW', noShowAt: new Date() };
      toStatus = 'NO_SHOW';
      break;

    default:
      throw new Error('Unknown action');
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: updateData,
  });

  await logStatusChange(appointmentId, current, toStatus, userId, reason);

  if (notifyUserId) {
    try {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          title: notifyTitle,
          message: notifyMsg,
          type: 'info',
          category: 'APPOINTMENT',
          link: isDoctor ? '/dashboard/appointments' : '/doctor',
        },
      });
    } catch {}
  }

  return updated;
}
