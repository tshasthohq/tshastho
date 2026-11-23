type Party = { id: string; commissionMode: string; commissionValue: any } | null;
type Item = { price: any; commissionType: string; commissionValue: any };

const r2 = (n: number) => Math.round(n * 100) / 100;

// Discount shob test e anupate bhag hoy. Commission net (discount-er por) price er upor.
export function calcCommissions(
  items: Item[],
  subtotal: number,
  total: number,
  parties: { role: "DOCTOR" | "AGENT"; p: Party }[]
) {
  const ratio = subtotal > 0 ? total / subtotal : 0;
  const out: { referrerId: string; role: string; base: number; amount: number }[] = [];
  for (const { role, p } of parties) {
    if (!p) continue;
    const v = Number(p.commissionValue || 0);
    let amount = 0;
    if (p.commissionMode === "PERCENT") amount = (total * v) / 100;
    else if (p.commissionMode === "FIXED") amount = v;
    else {
      amount = items.reduce((s, i) => {
        const net = Number(i.price) * ratio;
        const cv = Number(i.commissionValue || 0);
        return s + (i.commissionType === "PERCENT" ? (net * cv) / 100 : cv);
      }, 0);
    }
    amount = r2(Math.min(amount, total));
    if (amount > 0) out.push({ referrerId: p.id, role, base: r2(total), amount });
  }
  return out;
}
