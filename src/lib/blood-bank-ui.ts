export const STATUS_WORD: Record<string, string> = { AVAILABLE: "Available", LOW: "Low stock", OUT: "Out of stock" };
export const STATUS_CHIP: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  LOW: "bg-amber-100 text-amber-700",
  OUT: "bg-slate-100 text-slate-400",
};
export const STATUS_TILE: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  LOW: "bg-amber-50 text-amber-700 border-amber-100",
  OUT: "bg-red-50 text-red-700 border-red-100",
};

export function hoursText(b: { is24h?: boolean; openTime?: string | null; closeTime?: string | null }) {
  if (b.is24h) return "Open 24 hours";
  return [b.openTime, b.closeTime].filter(Boolean).join(" - ") || "Hours not listed";
}

export function joinAddr(...p: (string | null | undefined)[]) {
  return p.map((x) => (x || "").replace(/\s*,\s*/g, ", ").trim()).filter(Boolean).join(", ");
}

export const STATUS_DOT: Record<string, string> = { AVAILABLE: "bg-emerald-500", LOW: "bg-amber-500", OUT: "bg-slate-300" };

export function ago(d?: string | null) {
  if (!d) return "no activity yet";
  const m = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
