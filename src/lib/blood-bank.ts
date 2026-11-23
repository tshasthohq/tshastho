import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export const EXPIRY_DAYS: Record<string, number> = {
  WHOLE_BLOOD: 35,
  RBC: 35,
  PLATELETS: 5,
  PLASMA: 365,
};
export const COMPONENTS = Object.keys(EXPIRY_DAYS);
export const DAY = 86400000;

export async function getBankContext() {
  const auth = await requireRole(["BLOOD_BANK_OWNER"]);
  if (auth.error) return { error: auth.error };

  const bank = await prisma.bloodBank.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, user: { select: { status: true } } },
  });
  if (!bank) return { error: NextResponse.json({ error: "Blood bank profile not found" }, { status: 404 }) };
  if (bank.user.status !== "APPROVED")
    return { error: NextResponse.json({ error: "Your account is not approved yet" }, { status: 403 }) };

  return { userId: auth.user.id, bankId: bank.id };
}

export async function logAction(bankId: string, userId: string, action: string, detail?: string) {
  try {
    await prisma.bloodBankLog.create({ data: { bloodBankId: bankId, userId, action, detail: detail || null } });
  } catch (e) {
    console.error("[BLOOD_BANK_LOG]", e);
  }
}

export async function expireOldBags(bankId: string) {
  await prisma.bloodBag.updateMany({
    where: { bloodBankId: bankId, status: "AVAILABLE", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

export const TTI_TESTS = ["HIV", "HBSAG", "HCV", "SYPHILIS", "MALARIA"];
export const NEEDS_CROSSMATCH = ["WHOLE_BLOOD", "RBC"];
export const CROSSMATCH_VALID_HOURS = 72;

const abo = (g: string) => g.replace("_POS", "").replace("_NEG", "");
const rhPos = (g: string) => g.endsWith("_POS");
const RED_OK: Record<string, string[]> = { O: ["O", "A", "B", "AB"], A: ["A", "AB"], B: ["B", "AB"], AB: ["AB"] };
const PLASMA_OK: Record<string, string[]> = { AB: ["A", "B", "AB", "O"], A: ["A", "O"], B: ["B", "O"], O: ["O"] };

export function checkCompatibility(
  component: string,
  donorGroup: string,
  recipientGroup: string
): { level: "ok" | "warn" | "block"; reason?: string } {
  const d = abo(donorGroup);
  const r = abo(recipientGroup);

  if (component === "PLASMA") {
    return PLASMA_OK[d].includes(r) ? { level: "ok" } : { level: "block", reason: "ABO plasma mismatch" };
  }
  if (component === "PLATELETS") {
    if (d !== r) return { level: "warn", reason: "Platelets are not ABO identical to the recipient" };
    if (rhPos(donorGroup) && !rhPos(recipientGroup))
      return { level: "warn", reason: "Rh positive platelets for an Rh negative recipient" };
    return { level: "ok" };
  }
  if (component === "WHOLE_BLOOD" && d !== r) return { level: "block", reason: "Whole blood must be ABO identical" };
  if (!RED_OK[d].includes(r)) return { level: "block", reason: "ABO mismatch" };
  if (rhPos(donorGroup) && !rhPos(recipientGroup))
    return { level: "block", reason: "Rh positive blood for an Rh negative recipient" };
  return { level: "ok" };
}
