// Critical (panic) value limits. Adult defaults; applied by parameter name + unit.
const num = (v: any): number | null => {
  const s = String(v ?? "").replace(/,/g, "").trim();
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
};

export type CritLimit = { lo?: number; hi?: number };

export function critLimit(name: any, unit: any, v: number): CritLimit | null {
  const nm = String(name || "");
  const u = String(unit || "").toLowerCase();
  if (/urine|stool|csf|clearance|ratio/i.test(nm)) return null;
  if (/^\s*(haemoglobin|hemoglobin|hb)\b/i.test(nm)) return { lo: 7, hi: 20 };
  if (/platelet/i.test(nm)) return { lo: 20, hi: 1000 };
  if (/\b(wbc|tlc)\b|total\s+(leu[ck]ocyte|white|wbc|count)/i.test(nm)) return { lo: 2, hi: 30 };
  if (/potassium|^\s*k\s*\+?\s*$|\bk\+/i.test(nm)) return { lo: 2.8, hi: 6.5 };
  if (/sodium|^\s*na\s*\+?\s*$|\bna\+/i.test(nm)) return { lo: 120, hi: 160 };
  if (/glucose|\bfbs\b|\brbs\b|blood sugar/i.test(nm)) return /mg/.test(u) ? { lo: 40, hi: 450 } : { lo: 2.2, hi: 25 };
  if (/calcium/i.test(nm)) return /mmol/.test(u) || (!u && v < 5) ? { lo: 1.6, hi: 3.5 } : { lo: 6.5, hi: 14 };
  if (/creatinine/i.test(nm)) return /mol/.test(u) ? { hi: 660 } : { hi: 7.5 };
  if (/\binr\b/i.test(nm)) return { hi: 5 };
  return null;
}

export function isCritical(r: any): boolean {
  let v = num(r?.value);
  if (v === null) return false;
  if (/platelet|\b(wbc|tlc)\b|total\s+(leu[ck]ocyte|white|wbc|count)/i.test(String(r?.name || "")) && v >= 1000) v = v / 1000;
  const l = critLimit(r?.name, r?.unit, v);
  if (!l) return false;
  return (l.lo !== undefined && v < l.lo) || (l.hi !== undefined && v > l.hi);
}
