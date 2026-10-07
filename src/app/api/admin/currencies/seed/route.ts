import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { seedCurrencies } from '@/lib/currency';

export async function POST() {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const result = await seedCurrencies();
  return NextResponse.json({ success: true, ...result });
}
