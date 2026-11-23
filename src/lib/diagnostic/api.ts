import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { getDiagnosticFor } from "@/lib/diagnostic/context";

// write=true hole shudhu owner, na hole owner + staff
export async function diagCtx(write = false) {
  const roles = write ? ["DIAGNOSTIC_OWNER"] : ["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF"];
  const auth = await requireRole(roles);
  if (auth.error) return { error: auth.error, diagnostic: null as any };
  const diagnostic = await getDiagnosticFor(auth.user!);
  if (!diagnostic) {
    return {
      error: NextResponse.json({ message: "Diagnostic center not found" }, { status: 404 }),
      diagnostic: null as any,
    };
  }
  return { error: null, diagnostic, user: auth.user! };
}
