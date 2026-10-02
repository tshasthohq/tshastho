import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, shopName, drugLicense, tradeLicense, address, area, city, deliveryRadius } = body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      return NextResponse.json({ message: "Email or Phone already registered!" }, { status: 400 });
    }

    const existingLicense = await prisma.pharmacy.findUnique({ where: { drugLicense } });
    if (existingLicense) {
      return NextResponse.json({ message: "Drug License number already registered!" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPharmacy = await prisma.user.create({
      data: {
        name, email, phone,
        password: hashedPassword,
        role: "PHARMACY_OWNER",
        status: "PENDING",
        pharmacyProfile: {
          create: {
            shopName,
            drugLicense,
            tradeLicense,
            address,
            area: area || null,
            city,
            deliveryRadius: parseInt(deliveryRadius) || 5,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: "Application submitted! Awaiting Super Admin approval.", 
      userId: newPharmacy.id 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
