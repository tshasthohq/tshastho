import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, message: "Invalid Receipt ID" }, { status: 400 });
    }

    // ডাটাবেসে সেল নম্বরটি খোঁজা হচ্ছে
    const sale = await prisma.posSale.findFirst({
      where: { saleNumber: id },
      include: {
        items: true,
        pharmacy: {
          select: { shopName: true, address: true, city: true, phone: true, logo: true }
        }
      }
    });

    if (!sale) {
      return NextResponse.json({ success: false, message: "Receipt not found or fake!" }, { status: 404 });
    }

    return NextResponse.json({ success: true, sale }, { status: 200 });
  } catch (error) {
    console.error("VERIFY_ERROR:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
