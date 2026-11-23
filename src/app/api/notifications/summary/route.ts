import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { at: number; data: any }>();
const TTL_MS = 8000;

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user!.id;

  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return NextResponse.json(hit.data);

  const [unread, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);

  const data = { success: true, unread, notifications };
  cache.set(userId, { at: Date.now(), data });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user!.id;

  const body = await req.json().catch(() => ({}));
  if (body.all) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  } else if (body.id) {
    await prisma.notification.updateMany({ where: { id: String(body.id), userId }, data: { isRead: true } });
  } else {
    return NextResponse.json({ message: 'id or all required' }, { status: 400 });
  }
  cache.delete(userId);
  return NextResponse.json({ success: true });
}
