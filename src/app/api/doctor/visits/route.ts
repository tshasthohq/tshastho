import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';
import { getDoctorContext } from '@/lib/auth/doctor-context';

const schema = z.object({
  agentId: z.string().optional(),
  visitDate: z.string().optional(),
  patientName: z.string().optional(),
  agentName: z.string().optional(),
  organization: z.string().optional(),
  visitFee: z.coerce.number().min(0),
  commissionType: z.enum(['PERCENT', 'FIXED']).optional(),
  commissionRate: z.coerce.number().min(0).optional(),
  note: z.string().optional(),
});

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(['PENDING', 'PAID']),
});

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function GET(req: Request) {
  const auth = await requireRole(['DOCTOR']);
  if (auth.error) return auth.error;
  const doctor = await getDoctorContext(auth.user!);
  if (!doctor) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Doctor not found', 404);

  const month = new URL(req.url).searchParams.get('month') || '';
  const where: any = { doctorId: doctor.id };
  if (/^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    where.visitDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }
  const rows = await prisma.doctorVisit.findMany({ where, orderBy: { visitDate: 'desc' }, take: 500 });
  const visits = rows.map((v) => ({
    ...v,
    visitFee: Number(v.visitFee),
    commissionRate: Number(v.commissionRate),
    commissionAmount: Number(v.commissionAmount),
    netIncome: Number(v.netIncome),
  }));

  const summary = { count: visits.length, totalFee: 0, totalCommission: 0, totalNet: 0, pendingCommission: 0 };
  const byAgent: Record<string, any> = {};
  for (const v of visits) {
    summary.totalFee += v.visitFee;
    summary.totalCommission += v.commissionAmount;
    summary.totalNet += v.netIncome;
    if (v.status === 'PENDING') summary.pendingCommission += v.commissionAmount;
    const key = v.agentId || 'none';
    if (!byAgent[key]) byAgent[key] = { agentId: v.agentId, name: v.agentName || 'No agent', organization: v.organization, count: 0, fee: 0, commission: 0, pending: 0, pendingIds: [] as string[] };
    const g = byAgent[key];
    g.count++; g.fee += v.visitFee; g.commission += v.commissionAmount;
    if (v.status === 'PENDING') { g.pending += v.commissionAmount; g.pendingIds.push(v.id); }
  }
  return NextResponse.json({ success: true, visits, summary, byAgent: Object.values(byAgent) });
}

export async function POST(req: Request) {
  const auth = await requireRole(['DOCTOR']);
  if (auth.error) return auth.error;
  const doctor = await getDoctorContext(auth.user!);
  if (!doctor) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Doctor not found', 404);
  try {
    const data = schema.parse(await req.json());
    let agent: any = null;
    if (data.agentId) {
      agent = await prisma.doctorAgent.findUnique({ where: { id: data.agentId } });
      if (!agent || agent.doctorId !== doctor.id) return errorResponse(ErrorCodes.FORBIDDEN, 'Agent not in your list', 403);
    }
    const type = data.commissionType || agent?.commissionType || 'PERCENT';
    const rate = data.commissionRate ?? (agent ? Number(agent.commissionRate) : 0);
    if (type === 'PERCENT' && rate > 100) return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Percent 100-er beshi hote pare na', 400);
    const commission = round2(type === 'PERCENT' ? (data.visitFee * rate) / 100 : rate);
    if (commission > data.visitFee) return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Commission visit fee-er cheye beshi', 400);

    const visit = await prisma.doctorVisit.create({
      data: {
        doctorId: doctor.id,
        agentId: agent?.id || null,
        visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
        patientName: data.patientName?.trim() || null,
        agentName: data.agentName?.trim() || agent?.name || null,
        organization: data.organization?.trim() || agent?.organization || null,
        visitFee: data.visitFee,
        commissionType: type,
        commissionRate: rate,
        commissionAmount: commission,
        netIncome: round2(data.visitFee - commission),
        note: data.note?.trim() || null,
      },
    });
    return NextResponse.json({ success: true, visit: { ...visit, visitFee: Number(visit.visitFee), commissionAmount: Number(visit.commissionAmount), netIncome: Number(visit.netIncome) } });
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

export async function PATCH(req: Request) {
  const auth = await requireRole(['DOCTOR']);
  if (auth.error) return auth.error;
  const doctor = await getDoctorContext(auth.user!);
  if (!doctor) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Doctor not found', 404);
  try {
    const data = bulkSchema.parse(await req.json());
    const r = await prisma.doctorVisit.updateMany({
      where: { doctorId: doctor.id, id: { in: data.ids } },
      data: { status: data.status, paidAt: data.status === 'PAID' ? new Date() : null },
    });
    return NextResponse.json({ success: true, updated: r.count });
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}
