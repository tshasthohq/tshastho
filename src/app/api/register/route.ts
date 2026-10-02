import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email or Phone already exists!" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "CUSTOMER",
        patientProfile: { create: {} },
      },
    });

    return NextResponse.json({ message: "User registered successfully! 🚀", userId: newUser.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong", error: String(error) }, { status: 500 });
  }
}
