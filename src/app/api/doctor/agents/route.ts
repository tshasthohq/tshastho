import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';
import { getDoctorContext } from '@/lib/auth/doctor-context';

const schema = z.object({
  name: z.string().min(1, 'Naam likhun'),
  organization: z.string().optional(),
  agentType: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  commissionType: z.enum(['PERCENT', 'FIXED']).default('PERCENT'),
  commissionRate: z.coerce.number().min(0).default(0),
});

export async function GET() {
  const auth = await requireRole(['DOCTOR']);
  if (auth.error) return auth.error;
  const doctor = await getDoctorContext(auth.user!);
  if (!doctor) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Doctor not found', 404);
  const agents = await prisma.doctorAgent.findMany({
    where: { doctorId: doctor.id, isActive: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({
    success: true,
    agents: agents.map((a) => ({ ...a, commissionRate: Number(a.commissionRate) })),
  });
}

export async function POST(req: Request) {
  const auth = await requireRole(['DOCTOR']);
  if (auth.error) return auth.error;
  const doctor = await getDoctorContext(auth.user!);
  if (!doctor) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Doctor not found', 404);
  try {
    const data = schema.parse(await req.json());
    if (data.commissionType === 'PERCENT' && data.commissionRate > 100) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Percent 100-er beshi hote pare na', 400);
    }
    const agent = await prisma.doctorAgent.create({
      data: {
        doctorId: doctor.id,
        name: data.name.trim(),
        organization: data.organization?.trim() || null,
        agentType: data.agentType || 'AGENT',
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        commissionType: data.commissionType,
        commissionRate: data.commissionRate,
      },
    });
    return NextResponse.json({ success: true, agent: { ...agent, commissionRate: Number(agent.commissionRate) } });
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}
