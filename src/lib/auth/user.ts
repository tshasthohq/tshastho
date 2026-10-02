import { prisma } from '@/lib/prisma';
import { getSessionToken, verifySessionToken } from './session';

export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload || !payload.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id as string },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isVerified: true,
      parentPharmacyId: true, // <--- এখানে ফিক্স করা হয়েছে
      staffRole: true,
      permissions: true,
    },
  });

  return user;
}
