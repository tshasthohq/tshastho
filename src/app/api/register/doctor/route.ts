import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, licenseNumber, specialty, experience, consultationFee, bookingPhone, chamberAddress } = body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      return NextResponse.json({ message: "Email or Phone already registered!" }, { status: 400 });
    }

    const existingLicense = await prisma.doctor.findUnique({ where: { licenseNumber } });
    if (existingLicense) {
      return NextResponse.json({ message: "BMDC License number already registered!" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDoctor = await prisma.user.create({
      data: {
        name, email, phone,
        password: hashedPassword,
        role: "DOCTOR",
        status: "PENDING",
        doctorProfile: {
          create: {
            specialty,
            licenseNumber,
            experience: parseInt(experience),
            consultationFee: parseFloat(consultationFee),
            bookingPhone: bookingPhone || null,
            chamberAddress: chamberAddress || null,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: "Application submitted! Awaiting admin approval.", 
      userId: newDoctor.id 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
