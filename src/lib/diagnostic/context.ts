import { prisma } from '@/lib/prisma';

export async function getDiagnosticFor(user: { id: string; role: string }) {
  if (user.role === 'DIAGNOSTIC_OWNER') {
    return prisma.diagnostic.findUnique({ where: { userId: user.id } });
  }
  if (user.role === 'DIAGNOSTIC_STAFF') {
    const s = await prisma.diagnosticStaff.findUnique({
      where: { userId: user.id },
      include: { diagnostic: true },
    });
    return s?.diagnostic ?? null;
  }
  return null;
}
