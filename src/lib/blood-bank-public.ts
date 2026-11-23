import { prisma } from "@/lib/prisma";
import { CROSSMATCH_VALID_HOURS } from "@/lib/blood-rules";

export const GROUP_KEYS = ["A_POS", "A_NEG", "B_POS", "B_NEG", "O_POS", "O_NEG", "AB_POS", "AB_NEG"] as const;
export type StockStatus = "AVAILABLE" | "LOW" | "OUT";
export const stockStatus = (n: number): StockStatus => (n <= 0 ? "OUT" : n <= 3 ? "LOW" : "AVAILABLE");

export const PUBLIC_BANK_SELECT = {
  id: true, name: true, phone: true, address: true, area: true, district: true,
  is24h: true, openTime: true, closeTime: true, isOpen: true,
} as const;

export async function loadStatus(ids: string[]) {
  const out = new Map<string, Record<string, StockStatus>>();
  for (const id of ids) {
    out.set(id, Object.fromEntries(GROUP_KEYS.map((g) => [g, "OUT"])) as Record<string, StockStatus>);
  }
  if (!ids.length) return out;

  const rows = await prisma.bloodBag.groupBy({
    by: ["bloodBankId", "bloodGroup"],
    where: { bloodBankId: { in: ids }, status: "AVAILABLE", testsClear: true, expiresAt: { gt: new Date() }, crossmatches: { none: { result: "COMPATIBLE", doneAt: { gt: new Date(Date.now() - CROSSMATCH_VALID_HOURS * 3600000) } } } },
    _count: { _all: true },
  });
  for (const r of rows) {
    const m = out.get(r.bloodBankId);
    if (m) m[r.bloodGroup] = stockStatus(r._count._all);
  }
  return out;
}

export async function loadActivity(ids: string[]) {
  const out = new Map<string, Date | null>();
  if (!ids.length) return out;
  const rows = await prisma.bloodBag.groupBy({
    by: ["bloodBankId"],
    where: { bloodBankId: { in: ids } },
    _max: { updatedAt: true },
  });
  for (const r of rows) out.set(r.bloodBankId, r._max.updatedAt);
  return out;
}

export async function loadUnits(ids: string[]) {
  const out = new Map<string, Record<string, number>>();
  for (const id of ids) {
    out.set(id, Object.fromEntries(GROUP_KEYS.map((g) => [g, 0])) as Record<string, number>);
  }
  if (!ids.length) return out;
  const rows = await prisma.bloodBag.groupBy({
    by: ["bloodBankId", "bloodGroup"],
    where: { bloodBankId: { in: ids }, status: "AVAILABLE", testsClear: true, expiresAt: { gt: new Date() }, crossmatches: { none: { result: "COMPATIBLE", doneAt: { gt: new Date(Date.now() - CROSSMATCH_VALID_HOURS * 3600000) } } } },
    _count: { _all: true },
  });
  for (const r of rows) {
    const m = out.get(r.bloodBankId);
    if (m) m[r.bloodGroup] = r._count._all;
  }
  return out;
}
