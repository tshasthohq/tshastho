import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { staffId, requesterEmail } = await req.json();

    if (requesterEmail) {
      const requester = await prisma.user.findFirst({ where: { email: requesterEmail } });
      if (requester && requester.role !== "PHARMACY_OWNER" && requester.role !== "SUPER_ADMIN") {
        const reqPerms = (requester.permissions as string[]) || [];
        if (!reqPerms.includes("manage_staff")) {
          return NextResponse.json({ message: "❌ No permission to delete staff" }, { status: 403 });
        }
      }
    }
    await prisma.user.delete({ where: { id: staffId } });
    return NextResponse.json({ message: "Deleted ✅" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
