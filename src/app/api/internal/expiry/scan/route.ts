// POST /api/internal/expiry/scan — daily cron trigger
// Item 28

import { NextResponse } from 'next/server';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { scanExpiringBatches } from '@/lib/pharmacy/expiry-scanner';

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return errorResponse(ErrorCodes.AUTH_REQUIRED, 'Invalid cron secret', 401);
  }
  try {
    const result = await scanExpiringBatches({ notify: false });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[EXPIRY_CRON]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Cron scan failed', 500);
  }
}
