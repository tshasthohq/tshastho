import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: email }, { phone: email }] },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid password!" }, { status: 401 });
    }

    // Approval Check (Admin & Customer সবসময় ঢুকতে পারবে)
    if (user.role !== "SUPER_ADMIN" && user.role !== "CUSTOMER") {
      if (user.status === "PENDING") {
        return NextResponse.json({ message: "⏳ Your account is pending approval by Super Admin. Please wait." }, { status: 403 });
      }
      if (user.status === "REJECTED") {
        return NextResponse.json({ message: `❌ Your application was rejected. ${user.rejectReason ? "Reason: " + user.rejectReason : ""}` }, { status: 403 });
      }
      if (user.status === "SUSPENDED") {
        return NextResponse.json({ message: "⚠️ Your account has been suspended. Contact support." }, { status: 403 });
      }
    }

    return NextResponse.json(
      { message: "Login successful! 🚀", name: user.name || "User", role: user.role, status: user.status, staffRole: user.staffRole || null, parentPharmacyId: user.parentPharmacyId || null, permissions: user.permissions || [] },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
