// Terminal register / heartbeat / list — Item 20
// POST { action: 'register'|'heartbeat', deviceId, name?, model?, os? }
// GET  → list pharmacy terminals

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';

async function resolvePharmacyId(user: { id: string; role: string; parentPharmacyId?: string | null }) {
  let pharmacyId: string | null = user.parentPharmacyId ?? null;
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = p?.id ?? null;
  }
  return pharmacyId;
}

const bodySchema = z.object({
  action: z.enum(['register', 'heartbeat']),
  deviceId: z.string().min(8).max(80),
  name: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
  os: z.string().max(80).optional(),
  notes: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const pharmacyId = await resolvePharmacyId(user);
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const data = bodySchema.parse(await req.json());

    if (data.action === 'register') {
      const terminal = await prisma.posTerminal.upsert({
        where: { deviceId: data.deviceId },
        update: {
          name: data.name ?? undefined,
          model: data.model ?? undefined,
          os: data.os ?? undefined,
          lastSeenAt: new Date(),
          isActive: true,
        },
        create: {
          pharmacyId,
          deviceId: data.deviceId,
          name: data.name ?? 'POS Terminal',
          model: data.model,
          os: data.os,
          registeredBy: user.id,
          notes: data.notes,
        },
      });
      return NextResponse.json({ success: true, terminal });
    }

    // heartbeat
    const existing = await prisma.posTerminal.findUnique({
      where: { deviceId: data.deviceId },
      select: { id: true, pharmacyId: true },
    });
    if (!existing || existing.pharmacyId !== pharmacyId) {
      return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Terminal not registered', 404);
    }
    await prisma.posTerminal.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[POS_TERMINAL]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Terminal API failed', 500);
  }
}

export async function GET() {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const pharmacyId = await resolvePharmacyId(user);
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const now = Date.now();
    const terminals = await prisma.posTerminal.findMany({
      where: { pharmacyId },
      orderBy: { lastSeenAt: 'desc' },
    });

    const enriched = terminals.map((t) => ({
      ...t,
      online: now - new Date(t.lastSeenAt).getTime() < 2 * 60 * 1000,
    }));

    return NextResponse.json({ success: true, terminals: enriched });
  } catch (error) {
    console.error('[POS_TERMINAL_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Terminal list failed', 500);
  }
}
