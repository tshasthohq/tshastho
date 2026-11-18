import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export async function POST(req: Request) {
  try {
    const { query, page = 1, limit = 40 } = await req.json();

    const where: any = { isActive: true };
    
    if (query && query.trim()) {
      where.OR = [
        { name: { startsWith: query, mode: "insensitive" } },
        { brand: { startsWith: query, mode: "insensitive" } },
        { genericName: { startsWith: query, mode: "insensitive" } },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        pharmacy: {
          select: { 
            id: true, 
            shopName: true, 
            address: true, 
            area: true, 
            city: true, 
            deliveryRadius: true
            // isVerified সরিয়ে দেওয়া হলো, কারণ এটি হয়তো স্কিমাতে নেই
          },
        },
        branchStocks: {
          where: { quantity: { gt: 0 } },
          include: {
            branch: { select: { name: true, isMainBranch: true } }
          }
        }
      },
      take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
        orderBy: [
        { stock: 'desc' }, 
        { name: 'asc' }
      ],
    });

    const total = await prisma.medicine.count({ where });
    return NextResponse.json({ medicines, total, hasMore: (Number(page) * Number(limit)) < total }, { status: 200 });
  } catch (error) {
    console.error("Search API Error:", error); // টার্মিনালে আসল এরর দেখাবে
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
