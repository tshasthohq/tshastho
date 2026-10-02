import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const appointments = await prisma.appointment.findMany({
      where: { patientId: user.id },
      include: {
        doctor: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching appointments", error: String(error) }, { status: 500 });
  }
}
