import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { writeAudit } from "@/lib/diagnostic/audit";
import { snapshotOf, hashOf, ensureLegacyVersion } from "@/lib/diagnostic/verify";

const rowSchema = z.object({
  name: z.string().trim().min(1).max(120),
  unit: z.string().trim().max(30).nullable().optional(),
  value: z.string().trim().max(4000),
  low: z.union([z.string(), z.number()]).nullable().optional(),
  high: z.union([z.string(), z.number()]).nullable().optional(),
  group: z.string().trim().max(60).nullable().optional(),
  ranges: z.array(z.any()).nullable().optional(),
  ref: z.string().max(200).nullable().optional(),
  text: z.boolean().nullable().optional(),
  tx: z.string().max(4000).nullable().optional(),
  opts: z.array(z.string()).nullable().optional(),
  normal: z.array(z.string()).nullable().optional(),
});

import { isCritical } from "@/lib/diagnostic/critical";

const apiFlag = (r: any) => {
  if (Array.isArray(r.normal) && r.normal.length) {
    const v = String(r.value ?? "").trim();
    if (!v) return null;
    return r.normal.some((n: string) => n.toLowerCase() === v.toLowerCase()) ? "N" : "A";
  }
  return flagOf(r.value, r.low, r.high);
};

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("collect") }),
  z.object({
    action: z.literal("result"),
    rows: z.array(rowSchema).min(1).max(60),
    interpretation: z.string().max(2000).nullable().optional(),
    saveTemplate: z.boolean().optional(),
    technologistId: z.string().nullable().optional(),
    reason: z.string().optional(),
  }),
  z.object({ action: z.literal("verify"), pathologistId: z.string().nullable().optional(), informedTo: z.string().max(120).optional() }),
]);

const num = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
function flagOf(value: any, low: any, high: any) {
  const v = num(value), l = num(low), h = num(high);
  if (v === null || (l === null && h === null)) return null;
  if (l !== null && v < l) return "L";
  if (h !== null && v > h) return "H";
  return "N";
}

function techSigName(t: any, prev: any, fallback: string) {
  return t?.name || prev?.technologist?.name || fallback;
}

async function pickSigner(tx: any, diagnosticId: string, role: string, id?: string | null) {
  const s = id
    ? await tx.diagnosticSigner.findFirst({ where: { id, diagnosticId, role, isActive: true } })
    : await tx.diagnosticSigner.findFirst({ where: { diagnosticId, role, isActive: true }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  if (!s) return null;
  return { id: s.id, name: s.name, degree: s.degree, designation: s.designation, regNo: s.regNo, signatureUrl: s.signatureUrl };
}

const ERR: Record<string, string> = {
  NEED_INFORM: "CRITICAL value ache: doctor/patient-er nam (ke ke jaanano hoyeche) likhun, tarpor verify korun",
  NEED_SIGNER: "Age Signatories page-e Pathologist add korun, tarpor verify korun",
  NOT_FOUND: "Test item paoa jayni",
  BAD_STATE: "Ei obosthay ei kaj kora jabe na",
  NEED_REASON: "Verify howar por result bodlate karon likhun",
  EMPTY: "Kompokkhe ekta value din",
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const { id } = await params;
  const diagnosticId = c.diagnostic.id;
  const isOwner = c.user.role === "DIAGNOSTIC_OWNER";
  const userName = c.user.name || c.user.email || "Unknown";

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Invalid data" }, { status: 400 });
  const d = parsed.data;
  if (d.action === "verify" && !isOwner) {
    return NextResponse.json({ message: "Shudhu owner/pathologist verify korte parbe" }, { status: 403 });
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const item = await tx.diagnosticOrderItem.findFirst({
          where: { id, order: { diagnosticId, status: { not: "CANCELLED" } } },
          include: { order: { select: { id: true, orderNo: true } } },
        });
        if (!item) throw new Error("NOT_FOUND");
        const now = new Date();
        let to: string;
        let reason: string | null = null;

        if (d.action === "collect") {
          if (item.status !== "PENDING") throw new Error("BAD_STATE");
          await tx.diagnosticOrderItem.update({
            where: { id },
            data: { status: "SAMPLE_COLLECTED", sampleCollectedAt: now, sampleCollectedBy: userName },
          });
          to = "SAMPLE_COLLECTED";
        } else if (d.action === "result") {
          if (item.status === "PENDING") throw new Error("BAD_STATE");
          const wasFinal = item.status === "VERIFIED" || item.status === "APPROVED";
          if (wasFinal) {
            if (!d.reason || d.reason.trim().length < 3) throw new Error("NEED_REASON");
            reason = d.reason.trim();
          await ensureLegacyVersion(tx, item);
          }
          if (!d.rows.some((r) => r.value !== "")) throw new Error("EMPTY");
          const prevSig: any = (item.signers as any) || {};
          const techSig = await pickSigner(tx, diagnosticId, "TECHNOLOGIST", d.technologistId);
          const signersVal = { technologist: techSig ?? prevSig.technologist ?? null, pathologist: null, amendReason: wasFinal ? reason : (prevSig.amendReason ?? null) };
          const results = d.rows.map((r) => ({
            name: r.name, unit: r.unit || null, value: r.value,
            low: r.low ?? null, high: r.high ?? null,
            group: r.group || null,
            ref: r.ref || null,
        normal: r.normal && r.normal.length ? r.normal : null,
        flag: apiFlag(r), crit: isCritical(r) || undefined, text: r.text || undefined,
          }));
          await tx.diagnosticOrderItem.update({
            where: { id },
            data: {
              status: "RESULT_ENTERED", results: results as any, interpretation: d.interpretation || null,
              resultEnteredAt: now, resultEnteredBy: techSigName(techSig, prevSig, userName), signers: signersVal as any,
              verifiedAt: null, verifiedBy: null,
            },
          });
          if (d.saveTemplate && isOwner) {
            await tx.diagnosticTest.update({
              where: { id: item.testId },
              data: { resultTemplate: d.rows.map((r) => ({ name: r.name, unit: r.unit || null, low: r.low ?? null, high: r.high ?? null, group: r.group || null, ref: r.ref || null, opts: r.opts || null, normal: r.normal || null, r: r.ranges || null, text: r.text || undefined, tx: r.tx || undefined })) as any },
            });
          }
          to = "RESULT_ENTERED";
        } else {
          if (item.status !== "RESULT_ENTERED") throw new Error("BAD_STATE");
          const path = await pickSigner(tx, diagnosticId, "PATHOLOGIST", (d as any).pathologistId);
          if (!path) throw new Error("NEED_SIGNER");
        const critRows = (Array.isArray(item.results) ? (item.results as any[]) : []).filter((r: any) => isCritical(r));
        if (critRows.length) {
          const informedTo = String((d as any).informedTo || "").trim();
          if (informedTo.length < 2) throw new Error("NEED_INFORM");
          (item as any).signers = { ...((item.signers as any) || {}), critical: { params: critRows.map((r: any) => r.name), informedTo, informedAt: new Date().toISOString(), by: userName } };
          reason = "Critical value informed to " + informedTo;
        }
          await tx.diagnosticOrderItem.update({
            where: { id },
            data: { status: "VERIFIED", verifiedAt: now, verifiedBy: path.name, signers: { ...((item.signers as any) || {}), pathologist: path } as any },
          });
          const vItem = await tx.diagnosticOrderItem.findUnique({ where: { id } });
          const nextV = (await tx.diagnosticReportVersion.count({ where: { itemId: id } })) + 1;
          const snap = snapshotOf(vItem);
          const hash = hashOf(snap);
          await tx.diagnosticReportVersion.create({
            data: { itemId: id, version: nextV, snapshot: snap as any, hash, reason: (vItem?.signers as any)?.amendReason || (nextV > 1 ? "Amended" : null), createdBy: path.name },
          });
          await tx.diagnosticOrderItem.update({ where: { id }, data: { reportVersion: nextV, reportHash: hash } });
          to = "VERIFIED";
        }

        await writeAudit(tx, {
          diagnosticId, entity: "ORDER", entityId: item.order.id, entityLabel: item.order.orderNo,
          action: "UPDATE", reason, user: c.user,
          changes: [{ field: `Lab: ${item.testName}`, from: item.status, to }],
        });
      },
      { timeout: 20000, maxWait: 10000 }
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (ERR[e?.message]) return NextResponse.json({ message: ERR[e.message] }, { status: 400 });
    console.error("Lab item error:", e);
    return NextResponse.json({ message: "Save hoyni" }, { status: 500 });
  }
}
