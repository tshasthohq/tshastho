import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

async function me() {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error } as const;
  const user = await prisma.user.findFirst({ where: { email: auth.user!.email } });
  if (!user) return { error: NextResponse.json({ message: 'User not found' }, { status: 404 }) } as const;
  return { user } as const;
}

export async function POST(req: Request) {
  const r = await me();
  if ('error' in r) return r.error;
  const body = await req.json().catch(() => ({}));
  const sub = body.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ message: 'Invalid subscription' }, { status: 400 });
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId: r.user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent: req.headers.get('user-agent') || null },
    create: { userId: r.user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent: req.headers.get('user-agent') || null },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const r = await me();
  if ('error' in r) return r.error;
  const body = await req.json().catch(() => ({}));
  if (body.endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: String(body.endpoint), userId: r.user.id } });
  }
  return NextResponse.json({ success: true });
}
