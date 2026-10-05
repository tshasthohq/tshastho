import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const pharmacies = await prisma.pharmacy.findMany({
    where: { isOpen: true },
    orderBy: { shopName: 'asc' },
    take: 200,
    select: {
      id: true,
      shopName: true,
      address: true,
      area: true,
      city: true,
      
    },
  });

  return NextResponse.json({ success: true, pharmacies });
}
