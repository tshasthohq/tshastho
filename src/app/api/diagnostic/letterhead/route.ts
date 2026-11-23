import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";

const KEYS = ["tagline", "email", "website", "dghsRegNo", "helpline", "footerAddress"] as const;

export async function GET() {
  const c: any = await diagCtx(false);
  if (c.error) return c.error;
  const d: any = await (prisma as any).diagnostic.findUnique({ where: { id: c.diagnostic.id } });
  const out: any = {};
  for (const k of KEYS) out[k] = d?.[k] ?? "";
  return NextResponse.json({ success: true, letterhead: out });
}

export async function PATCH(req: Request) {
  const c: any = await diagCtx(true);
  if (c.error) return c.error;
  const body: any = await req.json().catch(() => ({}));
  const data: any = {};
  for (const k of KEYS) {
    if (k in body) {
      const v = String(body[k] ?? "").trim().slice(0, 200);
      data[k] = v || null;
    }
  }
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    return NextResponse.json({ success: false, message: "Email thik na" }, { status: 400 });
  }
  await (prisma as any).diagnostic.update({ where: { id: c.diagnostic.id }, data });
  return NextResponse.json({ success: true });
}
