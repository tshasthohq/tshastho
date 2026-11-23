import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";

const num = (v: any) => {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

export async function POST(req: Request) {
  const c = await diagCtx(true);
  if (c.error) return c.error;
  const diagnosticId = c.diagnostic.id;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ message: "File din" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ message: "File 5MB er boro" }, { status: 400 });

  let rows: any[];
  try {
    const isCsv = /\.csv$/i.test(file.name) || file.type === "text/csv";
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = isCsv
      ? XLSX.read(buf.toString("utf8").replace(/^\uFEFF/, ""), { type: "string" })
      : XLSX.read(buf, { type: "buffer" });
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  } catch {
    return NextResponse.json({ message: "File porte parlam na. .xlsx ba .csv din" }, { status: 400 });
  }
  if (rows.length > 3000) return NextResponse.json({ message: "Max 3000 row" }, { status: 400 });

  const [existing, deps] = await Promise.all([
    prisma.diagnosticTest.findMany({ where: { diagnosticId }, select: { id: true, code: true } }),
    prisma.diagnosticDepartment.findMany({ where: { diagnosticId } }),
  ]);
  const byCode = new Map(existing.map((t) => [t.code, t.id]));
  const depMap = new Map(deps.map((d) => [d.name.toLowerCase(), d.id]));

  const errors: string[] = [];
  const upd: { id: string; price: number; cost: string; ctype: string; cval: string; hours: string; active: boolean }[] = [];
  const creates: any[] = [];
  const seen = new Set<string>();

  rows.forEach((r, i) => {
    const line = i + 2;
    const code = String(r.Code ?? "").trim().toUpperCase();
    if (!code || seen.has(code)) return;
    seen.add(code);

    const price = num(r.Price);
    const cost = r.Cost === "" ? NaN : num(r.Cost);
    const cType = String(r.CommissionType || "").trim().toUpperCase();
    const cVal = r.CommissionValue === "" ? NaN : num(r.CommissionValue);
    const hours = r.ReportingHours === "" ? NaN : num(r.ReportingHours);

    if (Number.isNaN(price) || price < 0) { errors.push(`Row ${line} (${code}): price thik na`); return; }
    if (cType && !["PERCENT", "FIXED"].includes(cType)) { errors.push(`Row ${line} (${code}): CommissionType PERCENT/FIXED hote hobe`); return; }
    if (!Number.isNaN(cVal) && cVal < 0) { errors.push(`Row ${line} (${code}): commission thik na`); return; }
    if (cType === "PERCENT" && cVal > 100) { errors.push(`Row ${line} (${code}): commission % 100 er beshi`); return; }

    const activeCell = String(r.Active ?? "").trim().toUpperCase();
    let active = activeCell ? activeCell === "YES" : price > 0;
    if (price <= 0) active = false;

    const id = byCode.get(code);
    if (id) {
      upd.push({
        id, price, active,
        cost: Number.isNaN(cost) ? "" : String(cost),
        ctype: cType,
        cval: Number.isNaN(cVal) ? "" : String(cVal),
        hours: Number.isNaN(hours) ? "" : String(Math.round(hours)),
      });
    } else {
      const name = String(r.Name ?? "").trim();
      if (name.length < 2) { errors.push(`Row ${line} (${code}): notun test-er jonno Name lagbe`); return; }
      creates.push({
        diagnosticId, code, name,
        departmentId: depMap.get(String(r.Department ?? "").trim().toLowerCase()) ?? null,
        sampleType: String(r.Sample ?? "").trim() || null,
        price, isActive: active,
        costPrice: Number.isNaN(cost) ? 0 : cost,
        commissionType: cType || "PERCENT",
        commissionValue: Number.isNaN(cVal) ? 0 : cVal,
        reportingHours: Number.isNaN(hours) ? 24 : Math.round(hours),
      });
    }
  });

  try {
    for (let i = 0; i < upd.length; i += 500) {
      const b = upd.slice(i, i + 500);
      await prisma.$executeRaw`
        UPDATE "DiagnosticTest" AS t SET
          "price" = v.price::numeric,
          "isActive" = v.active::boolean,
          "costPrice" = COALESCE(NULLIF(v.cost, '')::numeric, t."costPrice"),
          "commissionType" = COALESCE(NULLIF(v.ctype, ''), t."commissionType"),
          "commissionValue" = COALESCE(NULLIF(v.cval, '')::numeric, t."commissionValue"),
          "reportingHours" = COALESCE(NULLIF(v.hours, '')::int, t."reportingHours"),
          "updatedAt" = now()
        FROM (
          SELECT
            unnest(${b.map((x) => x.id)}::text[]) AS id,
            unnest(${b.map((x) => String(x.price))}::text[]) AS price,
            unnest(${b.map((x) => String(x.active))}::text[]) AS active,
            unnest(${b.map((x) => x.cost)}::text[]) AS cost,
            unnest(${b.map((x) => x.ctype)}::text[]) AS ctype,
            unnest(${b.map((x) => x.cval)}::text[]) AS cval,
            unnest(${b.map((x) => x.hours)}::text[]) AS hours
        ) AS v
        WHERE t."id" = v.id AND t."diagnosticId" = ${diagnosticId}`;
    }
    if (creates.length) await prisma.diagnosticTest.createMany({ data: creates, skipDuplicates: true });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json({ message: "Import fail hoyeche" }, { status: 500 });
  }

  return NextResponse.json({
    success: true, updated: upd.length, created: creates.length,
    errors: errors.slice(0, 20), errorCount: errors.length,
  });
}
