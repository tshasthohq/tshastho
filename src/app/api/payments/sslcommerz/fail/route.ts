import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const tranId = formData.get('tran_id') as string | null;
    if (tranId) {
      await prisma.payment.update({
        where: { id: tranId },
        data: { status: 'FAILED', failureReason: 'Gateway reported failure' },
      }).catch(() => {});
    }
  } catch {}
  return NextResponse.redirect(`${appUrl}/payment/failed`);
}
