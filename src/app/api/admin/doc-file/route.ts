import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
const BUCKET = "tshastho_private_docs";
const MIME: Record<string, string> = {
  jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf",
};

export async function GET(req: Request) {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  const path = (new URL(req.url).searchParams.get("path") || "").replace(/^private:/, "");
  if (!/^licenses\/[A-Za-z0-9_.-]+$/.test(path)) {
    return NextResponse.json({ error: "Invalid document path" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Storage is not configured" }, { status: 500 });

  const { data, error } = await createClient(url, key).storage.from(BUCKET).download(path);
  if (error || !data) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const ext = path.split(".").pop() || "";
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
