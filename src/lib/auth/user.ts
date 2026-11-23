import { prisma } from '@/lib/prisma';
import { getSessionToken, verifySessionToken, hashToken } from './session';

const TTL_MS = 15000;
const cache = new Map<string, { at: number; expiresAt: number; user: any }>();

export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;

  const hashed = hashToken(token);
  const hit = cache.get(hashed);
  if (hit && Date.now() - hit.at < TTL_MS && hit.expiresAt > Date.now()) {
    return hit.user;
  }

  // P1-07 FIX: Check if session exists in DB and is not expired
  const session = await prisma.session.findFirst({
    where: { token: hashed, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!session) {
    cache.delete(hashed);
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload || !payload.id) return null;

  const user = session.user;
  if (!user || user.status !== 'APPROVED') {
    cache.delete(hashed);
    return null;
  }

  if (cache.size > 500) cache.clear();
  cache.set(hashed, { at: Date.now(), expiresAt: new Date(session.expiresAt).getTime(), user });
  return user;
}
