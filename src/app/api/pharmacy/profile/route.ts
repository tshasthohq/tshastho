import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    
    // চেক করা হচ্ছে ইউজারের কোনো parentPharmacyId আছে কি না (স্টাফদের জন্য)
    if (user.parentPharmacyId) {
      pharmacy = await prisma.pharmacy.findUnique({
        where: { id: user.parentPharmacyId },
        include: { user: true },
      });
    }
    
    // যদি না থাকে, তবে userId দিয়ে খোঁজা হচ্ছে (ওনার্সদের জন্য)
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.findUnique({
        where: { userId: user.id },
        include: { user: true },
      });
    }

    return NextResponse.json({ pharmacy }, { status: 200 });
  } catch (error) {
    console.error("PHARMACY_PROFILE_ERROR:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}


export async function PUT(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const updated = await prisma.pharmacy.update({
      where: { id: pharmacy.id },
      data: {
        shopName: body.shopName, address: body.address, area: body.area, city: body.city,
        drugLicense: body.drugLicense, tradeLicense: body.tradeLicense, phone: body.phone, logo: body.logo,
        deliveryFee: parseFloat(body.deliveryFee) || 0,
        deliveryRadius: parseInt(body.deliveryRadius) || 5,
        openTime: body.openTime,
        closeTime: body.closeTime,
        isOpen: body.isOpen, lowStockAlert: body.lowStockAlert, expiryAlert: body.expiryAlert,
      }
    });

    // নতুন কোড: ইউজারের নাম এবং ছবি আপডেট করা
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.userName,
        avatarUrl: body.userAvatar,
      }
    });

    return NextResponse.json({ success: true, pharmacy: { ...updated, user: updatedUser } });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
  }
}
