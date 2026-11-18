import { prisma } from "@/lib/prisma";

const cache = new Map<string, { id: string; at: number }>();

export async function getPharmacyId(userId: string, hint?: string | null) {
  if (hint) return hint;
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < 300000) return hit.id;

  const u = await prisma.user.findUnique({ where: { id: userId }, select: { parentPharmacyId: true } });
  let id: string | null = u?.parentPharmacyId ?? null;
  if (!id) {
    const p = await prisma.pharmacy.findFirst({ where: { userId }, select: { id: true } });
    id = p?.id ?? null;
  }
  if (id) cache.set(userId, { id, at: Date.now() });
  return id;
}
