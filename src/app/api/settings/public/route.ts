import { NextResponse } from 'next/server';
import { PUBLIC_CACHE } from "@/lib/cache";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [hotline, autoTopup] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'hotline_number' } }),
      prisma.systemSetting.findUnique({ where: { key: 'wallet_auto_topup_enabled' } }),
    ]);
    return NextResponse.json({
      success: true,
      hotlineNumber: hotline?.value || '01737326555',
      walletAutoTopupEnabled: autoTopup ? autoTopup.value !== 'false' : true,
    }, { headers: PUBLIC_CACHE });
  } catch (error) {
    return NextResponse.json({ success: true, hotlineNumber: '01737326555', walletAutoTopupEnabled: true });
  }
}
