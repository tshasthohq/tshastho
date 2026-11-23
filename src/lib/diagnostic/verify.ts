import crypto from "crypto";

const secret = () =>
  process.env.REPORT_VERIFY_SECRET || process.env.JWT_SECRET || process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET || process.env.JWT_ACCESS_SECRET || "";

const mac = (data: string, s: string) => crypto.createHmac("sha256", s).update(data).digest("base64url").slice(0, 22);

// token = itemId.version.mac
export function signItem(id: string, v = 1): string {
  const s = secret();
  if (!s) throw new Error("no verify secret");
  return id + "." + v + "." + mac(id + "." + v, s);
}

export function readToken(t: string): { id: string; v: number } | null {
  const s = secret();
  if (!s || !t) return null;
  const p = t.split(".");
  if (p.length !== 3) return null;
  const v = Number(p[1]);
  if (!Number.isInteger(v) || v < 1) return null;
  const a = Buffer.from(p[2]);
  const b = Buffer.from(mac(p[0] + "." + v, s));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { id: p[0], v };
}

const iso = (d: any) => (d ? new Date(d).toISOString() : null);

export function snapshotOf(it: any) {
  return {
    testCode: it.testCode ?? null,
    testName: it.testName ?? null,
    results: it.results ?? null,
    interpretation: it.interpretation ?? null,
    signers: it.signers ?? null,
    sampleCollectedAt: iso(it.sampleCollectedAt),
    resultEnteredAt: iso(it.resultEnteredAt),
    resultEnteredBy: it.resultEnteredBy ?? null,
    verifiedAt: iso(it.verifiedAt),
    verifiedBy: it.verifiedBy ?? null,
  };
}

const stable = (v: any): any =>
  Array.isArray(v)
    ? v.map(stable)
    : v && typeof v === "object"
    ? Object.keys(v).sort().reduce((o: any, k) => { o[k] = stable(v[k]); return o; }, {})
    : v;

export function hashOf(snap: any): string {
  return crypto.createHash("sha256").update(JSON.stringify(stable(snap))).digest("hex");
}

// Version system chalur age verify howa item edit hole, ager state v1 hishebe rakha
export async function ensureLegacyVersion(tx: any, item: any) {
  const n = await tx.diagnosticReportVersion.count({ where: { itemId: item.id } });
  if (n > 0 || !item.verifiedAt) return;
  const snap = snapshotOf(item);
  const hash = hashOf(snap);
  await tx.diagnosticReportVersion.create({
    data: { itemId: item.id, version: 1, snapshot: snap as any, hash, reason: "Before versioning", createdBy: item.verifiedBy || null },
  });
  await tx.diagnosticOrderItem.update({ where: { id: item.id }, data: { reportVersion: 1, reportHash: hash } });
}
