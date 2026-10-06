import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { seedCommonInteractions } from '@/lib/pharmacy/interactions';

export async function POST() {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const created = await seedCommonInteractions();
  return NextResponse.json({ success: true, created });
}
