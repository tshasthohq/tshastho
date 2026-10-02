import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ message: "No file provided" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ message: "File too large (max 5MB)" }, { status: 400 });

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `med-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabase.storage
      .from("medicines")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ message: "Upload failed: " + error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("medicines")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
