import { prisma } from '@/lib/prisma';

export interface SubstituteResult {
  id: string;
  name: string;
  brand?: string;
  genericName?: string;
  sellingPrice: number;
  stock: number;
  matchType: 'CURATED' | 'GENERIC' | 'CATEGORY';
  savings?: number;
  reason?: string;
}

export async function getSubstitutes(params: {
  pharmacyId: string;
  medicineId: string;
  limit?: number;
}): Promise<{ original: any; substitutes: SubstituteResult[] }> {
  const medicine = await prisma.medicine.findUnique({
    where: { id: params.medicineId },
    select: {
      id: true,
      name: true,
      brand: true,
      genericName: true,
      category: true,
      sellingPrice: true,
    },
  });

  if (!medicine) throw new Error('Medicine not found');

  const results: SubstituteResult[] = [];
  const seen = new Set<string>([medicine.id]);

  // Tier 1: Curated
  const curated = await prisma.medicineSubstitute.findMany({
    where: {
      isActive: true,
      OR: [
        { pharmacyId: params.pharmacyId },
        { isGlobal: true },
      ],
      originalName: { equals: medicine.name, mode: 'insensitive' as any },
    },
    take: 20,
  });

  for (const c of curated) {
    const found = await prisma.medicine.findFirst({
      where: {
        pharmacyId: params.pharmacyId,
        name: { equals: c.substituteName, mode: 'insensitive' as any },
        isActive: true,
      },
    });
    if (found && !seen.has(found.id)) {
      seen.add(found.id);
      results.push({
        id: found.id,
        name: found.name,
        brand: found.brand || undefined,
        genericName: found.genericName || undefined,
        sellingPrice: Number(found.sellingPrice),
        stock: found.stock,
        matchType: 'CURATED',
        savings: Number(found.sellingPrice) - Number(medicine.sellingPrice),
        reason: c.reason || undefined,
      });
    }
  }

  // Tier 2: Generic match
  if (medicine.genericName) {
    const genericMatches = await prisma.medicine.findMany({
      where: {
        pharmacyId: params.pharmacyId,
        genericName: { equals: medicine.genericName, mode: 'insensitive' as any },
        id: { not: medicine.id },
        isActive: true,
      },
      take: 15,
      orderBy: [{ stock: 'desc' }, { sellingPrice: 'asc' }],
    });

    for (const m of genericMatches) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      results.push({
        id: m.id,
        name: m.name,
        brand: m.brand || undefined,
        genericName: m.genericName || undefined,
        sellingPrice: Number(m.sellingPrice),
        stock: m.stock,
        matchType: 'GENERIC',
        savings: Number(m.sellingPrice) - Number(medicine.sellingPrice),
      });
    }
  }

  // Tier 3: Category fallback
  if (results.length < 5 && medicine.category) {
    const categoryMatches = await prisma.medicine.findMany({
      where: {
        pharmacyId: params.pharmacyId,
        category: medicine.category,
        id: { notIn: Array.from(seen) },
        isActive: true,
      },
      take: 5,
      orderBy: [{ stock: 'desc' }, { sellingPrice: 'asc' }],
    });

    for (const m of categoryMatches) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      results.push({
        id: m.id,
        name: m.name,
        brand: m.brand || undefined,
        genericName: m.genericName || undefined,
        sellingPrice: Number(m.sellingPrice),
        stock: m.stock,
        matchType: 'CATEGORY',
        savings: Number(m.sellingPrice) - Number(medicine.sellingPrice),
      });
    }
  }

  results.sort((a, b) => {
    const order = { CURATED: 0, GENERIC: 1, CATEGORY: 2 };
    if (order[a.matchType] !== order[b.matchType]) return order[a.matchType] - order[b.matchType];
    if (a.stock > 0 && b.stock === 0) return -1;
    if (a.stock === 0 && b.stock > 0) return 1;
    return a.sellingPrice - b.sellingPrice;
  });

  return {
    original: medicine,
    substitutes: results.slice(0, params.limit || 10),
  };
}
