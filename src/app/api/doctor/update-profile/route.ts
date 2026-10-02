import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { doctorId, bookingPhone } = body;

    console.log("Update request:", { doctorId, bookingPhone });

    if (!doctorId) {
      return NextResponse.json({ message: "Doctor ID missing" }, { status: 400 });
    }

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: { bookingPhone: bookingPhone || null },
    });

    return NextResponse.json({ message: "Profile updated!", doctor }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Update failed", error: String(error) }, { status: 500 });
  }
}
