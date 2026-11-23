export type Change = { field: string; from: any; to: any };

const norm = (v: any) =>
  v === undefined || v === null || v === ""
    ? null
    : typeof v === "object" && typeof v.toNumber === "function"
    ? v.toNumber()
    : v instanceof Date
    ? v.toISOString()
    : v;

// labels = { dbField: "Dekhanor naam" }. Shudhu 'after' e thaka field gulo compare hoy
export function diffFields(before: Record<string, any>, after: Record<string, any>, labels: Record<string, string>): Change[] {
  const out: Change[] = [];
  for (const k of Object.keys(labels)) {
    if (!(k in after) || after[k] === undefined) continue;
    const a = norm(before[k]);
    const b = norm(after[k]);
    if (String(a) !== String(b)) out.push({ field: labels[k], from: a, to: b });
  }
  return out;
}

export async function writeAudit(
  db: any,
  p: {
    diagnosticId: string;
    entity: string;
    entityId: string;
    entityLabel?: string | null;
    action: string;
    changes?: Change[] | null;
    reason?: string | null;
    user?: { id?: string; name?: string | null; email?: string | null } | null;
  }
) {
  await db.diagnosticAuditLog.create({
    data: {
      diagnosticId: p.diagnosticId,
      entity: p.entity,
      entityId: p.entityId,
      entityLabel: p.entityLabel ?? null,
      action: p.action,
      changes: (p.changes ?? undefined) as any,
      reason: p.reason ?? null,
      userId: p.user?.id ?? null,
      userName: p.user?.name || p.user?.email || null,
    },
  });
}
