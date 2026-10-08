import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * SSL Wireless delivery status webhook
 * Configure in SSL Wireless dashboard: https://your-domain.com/api/webhooks/sms/ssl-wireless
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // SSL Wireless sends array of status updates
    const updates = Array.isArray(body) ? body : [body];

    for (const update of updates) {
      const csmsId = update.csms_id;
      const status = update.status; // DELIVERED, FAILED, etc.

      if (!csmsId) continue;

      const log = await prisma.smsLog.findFirst({
        where: { providerRefId: csmsId },
      });

      if (!log) continue;

      const newStatus =
        status === 'DELIVERED' ? 'DELIVERED' :
        status === 'FAILED' ? 'FAILED' :
        log.status;

      await prisma.smsLog.update({
        where: { id: log.id },
        data: {
          status: newStatus as any,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          failureReason: status === 'FAILED' ? (update.reason || 'Delivery failed') : undefined,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SMS_WEBHOOK]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'SSL Wireless webhook endpoint ready' });
}
