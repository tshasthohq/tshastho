// POST /api/internal/retention/purge
// Cron endpoint — called from GitHub Action daily.
// Auth: header x-cron-secret must match CRON_SECRET env var.
// Item 18

import { NextResponse } from 'next/server';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { runRetentionPurge } from '@/lib/pharmacy/retention-policy';

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return errorResponse(ErrorCodes.AUTH_REQUIRED, 'Invalid cron secret', 401);
  }

  try {
    const stats = await runRetentionPurge({ limit: 500 });
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('[RETENTION_PURGE]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Purge failed', 500);
  }
}
