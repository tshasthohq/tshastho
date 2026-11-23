import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionToken, verifySessionToken } from '@/lib/auth/session';

const TTL_MS = 5000;
const cache = new Map<string, { at: number; user: any }>();

export async function GET() {
  try {
    const token = await getSessionToken();
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = await verifySessionToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const id = payload.id as string;
    const hit = cache.get(id);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return NextResponse.json({ success: true, user: hit.user });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, avatarUrl: true,
        role: true, status: true, isVerified: true, address: true,
        parentPharmacyId: true, staffRole: true, permissions: true,
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (cache.size > 500) cache.clear();
    cache.set(id, { at: Date.now(), user });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[AUTH_ME]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
