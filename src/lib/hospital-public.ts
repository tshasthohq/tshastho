import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type HospitalSearch = {
  q?: string;
  city?: string;
  emergency?: boolean;
  is24x7?: boolean;
  page?: number;
};

const PAGE_SIZE = 12;

export async function searchHospitals(p: HospitalSearch) {
  const page = Math.max(1, Math.floor(p.page ?? 1));

  const branchFilter: Prisma.HospitalBranchWhereInput = { isActive: true, deletedAt: null };
  if (p.city) branchFilter.city = { contains: p.city, mode: 'insensitive' };
  if (p.emergency) branchFilter.hasEmergency = true;
  if (p.is24x7) branchFilter.is24x7 = true;

  const where: Prisma.HospitalWhereInput = {
    status: 'APPROVED',
    deletedAt: null,
    branches: { some: branchFilter },
  };
  if (p.q) {
    where.OR = [
      { name: { contains: p.q, mode: 'insensitive' } },
      { nameBn: { contains: p.q, mode: 'insensitive' } },
      { branches: { some: { area: { contains: p.q, mode: 'insensitive' } } } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.hospital.count({ where }),
    prisma.hospital.findMany({
      where,
      orderBy: [{ verifiedAt: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        name: true,
        nameBn: true,
        logo: true,
        type: true,
        verifiedAt: true,
        branches: {
          where: { isActive: true, deletedAt: null },
          orderBy: { isMain: 'desc' },
          take: 3,
          select: { id: true, name: true, city: true, area: true, is24x7: true, hasEmergency: true, bedCount: true },
        },
      },
    }),
  ]);

  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getPublicHospital(slug: string) {
  return prisma.hospital.findFirst({
    where: { slug, status: 'APPROVED', deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      nameBn: true,
      logo: true,
      coverImage: true,
      about: true,
      type: true,
      website: true,
      phone: true,
      email: true,
      verifiedAt: true,
      branches: {
        where: { isActive: true, deletedAt: null },
        orderBy: { isMain: 'desc' },
        select: {
          id: true,
          name: true,
          address: true,
          area: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
          phone: true,
          emergencyPhone: true,
          is24x7: true,
          hasEmergency: true,
          bedCount: true,
          openTime: true,
          closeTime: true,
          departments: { where: { isActive: true }, select: { id: true, name: true, nameBn: true } },
        },
      },
    },
  });
}
