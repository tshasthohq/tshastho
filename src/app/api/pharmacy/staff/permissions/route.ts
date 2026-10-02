import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { staffId, permissions, requesterEmail } = await req.json();

    if (requesterEmail) {
      const requester = await prisma.user.findFirst({ where: { email: requesterEmail } });
      if (requester && requester.role !== "PHARMACY_OWNER" && requester.role !== "SUPER_ADMIN") {
        const reqPerms = (requester.permissions as string[]) || [];
        if (!reqPerms.includes("manage_staff")) {
          return NextResponse.json({ message: "❌ No permission" }, { status: 403 });
        }
      }
    }

    const staff = await prisma.user.update({
      where: { id: staffId },
      data: { permissions },
    });

    return NextResponse.json({ message: "Permissions updated ✅", staff }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
