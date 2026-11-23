import { BloodGroup, Prisma } from "@prisma/client";
import { DONATION_GAP_DAYS } from "@/lib/blood-rules";

const MAP: Record<string, BloodGroup> = {
  "A+": "A_POS", "A-": "A_NEG", "B+": "B_POS", "B-": "B_NEG",
  "AB+": "AB_POS", "AB-": "AB_NEG", "O+": "O_POS", "O-": "O_NEG",
};

export function parseGroup(v: unknown): BloodGroup | null {
  if (typeof v !== "string") return null;
  const k = v.trim().toUpperCase().replace(/\s/g, "");
  if (MAP[k]) return MAP[k];
  return (Object.values(BloodGroup) as string[]).includes(k) ? (k as BloodGroup) : null;
}

export const groupLabel = (g: string) => g.replace("_POS", "+").replace("_NEG", "-");
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const DAY = 86400000;

export function isEligible(last?: Date | null, gender?: string | null) {
  if (!last) return true;
  const gap = gender === "FEMALE" ? DONATION_GAP_DAYS.female : DONATION_GAP_DAYS.male;
  return Date.now() - last.getTime() >= gap * DAY;
}

export function eligibleWhere(): Prisma.BloodDonorWhereInput {
  const c90 = new Date(Date.now() - DONATION_GAP_DAYS.male * DAY);
  const c120 = new Date(Date.now() - DONATION_GAP_DAYS.female * DAY);
  return {
    isAvailable: true,
    OR: [
      { lastDonationDate: null },
      { lastDonationDate: { lt: c120 } },
      { lastDonationDate: { lt: c90 }, NOT: { gender: "FEMALE" } },
    ],
  };
}

export const clean = (v: unknown, max = 120) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
