import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const all = await prisma.systemSetting.findMany();
    const settings: any = {};
    for (const s of all) settings[s.key] = s.value;
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { settings } = await req.json();

    for (const key of Object.keys(settings)) {
      const existing = await prisma.systemSetting.findUnique({ where: { key } });
      if (existing) {
        await prisma.systemSetting.update({
          where: { key },
          data: { value: String(settings[key]) },
        });
      } else {
        await prisma.systemSetting.create({
          data: { key, value: String(settings[key]) },
        });
      }
    }

    return NextResponse.json({ message: "Settings updated ✅" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
