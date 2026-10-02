import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getDefaultPermissions } from "@/lib/permissions";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { ownerEmail, name, email, phone, password, staffRole, permissions, basicSalary, dailyRate, commissionPercent, salaryType, workingDaysPerMonth, hoursPerDay } = await req.json();

    const owner = await prisma.user.findFirst({ where: { email: ownerEmail } });
    if (!owner) return NextResponse.json({ message: "Owner not found" }, { status: 404 });

    // Permission check
    if (owner.role !== "PHARMACY_OWNER" && owner.role !== "SUPER_ADMIN") {
      const reqPerms = (owner.permissions as string[]) || [];
      if (!reqPerms.includes("manage_staff")) {
        return NextResponse.json({ message: "❌ You don't have permission to add staff" }, { status: 403 });
      }
    }

    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: owner.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      return NextResponse.json({ message: "Email or Phone already registered!" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalPermissions = Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : getDefaultPermissions(staffRole);

    const staff = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "PHARMACY_STAFF",
        status: "APPROVED",
        isVerified: true,
        parentPharmacyId: pharmacy.id,
        staffRole: staffRole || "CASHIER",
        permissions: finalPermissions,
        basicSalary: parseFloat(basicSalary) || 0,
        dailyRate: parseFloat(dailyRate) || 0,
        commissionPercent: parseFloat(commissionPercent) || 0,
        salaryType: salaryType || "MONTHLY",
        workingDaysPerMonth: parseInt(workingDaysPerMonth) || 30,
        hoursPerDay: parseInt(hoursPerDay) || 8,
      },
    });

    return NextResponse.json({ 
      message: "Staff added ✅", 
      staff: { id: staff.id, name: staff.name, email: staff.email, staffRole: staff.staffRole } 
    }, { status: 201 });
  } catch (error) {
    console.error("Add staff error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
