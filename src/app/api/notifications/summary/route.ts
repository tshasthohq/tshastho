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

export async function GET() {
  const r = await me();
  if ('error' in r) return r.error;
  const [unread, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId: r.user.id, isRead: false } }),
    prisma.notification.findMany({
      where: { userId: r.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);
  return NextResponse.json({ success: true, unread, notifications });
}

export async function PATCH(req: Request) {
  const r = await me();
  if ('error' in r) return r.error;
  const body = await req.json().catch(() => ({}));
  if (body.all) {
    await prisma.notification.updateMany({ where: { userId: r.user.id, isRead: false }, data: { isRead: true } });
  } else if (body.id) {
    await prisma.notification.updateMany({ where: { id: String(body.id), userId: r.user.id }, data: { isRead: true } });
  } else {
    return NextResponse.json({ message: 'id or all required' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
