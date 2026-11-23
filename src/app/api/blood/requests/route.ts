import { NextResponse } from "next/server";
import { alertDonors } from "@/lib/blood-alerts";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { parseGroup, clean, BD_PHONE } from "@/lib/blood";

export const dynamic = "force-dynamic";
const PAGE = 20;
const HOUR = 3600000;

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const group = parseGroup(sp.get("bloodGroup"));
    const district = clean(sp.get("district"));
    const page = Math.max(1, Number(sp.get("page")) || 1);

    const where = {
      status: "OPEN" as const,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      ...(group ? { bloodGroup: group } : {}),
      ...(district ? { district } : {}),
    };

    const requests = await prisma.bloodRequest.findMany({
      where,
      select: {
        id: true, bloodGroup: true, units: true, hospital: true, district: true,
        upazila: true, urgency: true, neededBy: true, note: true, createdAt: true,
        _count: { select: { responses: true } },
      },
      orderBy: [{ urgency: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE,
      take: PAGE,
    });

    return NextResponse.json(
      { requests },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } }
    );
  } catch (e) {
    console.error("[BLOOD_REQ_GET]", e);
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const recent = await prisma.bloodRequest.count({
      where: { requesterId: user.id, createdAt: { gt: new Date(Date.now() - 24 * HOUR) } },
    });
    if (recent >= 3)
      return NextResponse.json({ error: "Daily request limit reached. Please try again tomorrow." }, { status: 429 });

    const b = await req.json();
    const bloodGroup = parseGroup(b.bloodGroup);
    const hospital = clean(b.hospital, 160);
    const division = clean(b.division);
    const district = clean(b.district);
    const contactPhone = clean(b.contactPhone, 20).replace(/[\s-]/g, "");
    const units = Math.min(10, Math.max(1, Number(b.units) || 1));
    const urgency = ["CRITICAL", "TODAY", "SCHEDULED"].includes(b.urgency) ? b.urgency : "TODAY";

    if (!bloodGroup || hospital.length < 3 || !division || !district)
      return NextResponse.json({ error: "Blood group, hospital and location are required" }, { status: 400 });
    if (b.confirmGenuine !== true)
      return NextResponse.json({ error: "Please confirm this request is genuine" }, { status: 400 });
    if (!BD_PHONE.test(contactPhone))
      return NextResponse.json({ error: "Enter a valid Bangladeshi phone number" }, { status: 400 });

    let neededBy: Date | null = null;
    if (b.neededBy) {
      neededBy = new Date(b.neededBy);
      if (isNaN(+neededBy)) neededBy = null;
    }
    const expiresAt = new Date(
      urgency === "CRITICAL" ? Date.now() + 24 * HOUR
      : urgency === "TODAY" ? Date.now() + 48 * HOUR
      : (neededBy ? +neededBy + 24 * HOUR : Date.now() + 7 * 24 * HOUR)
    );

    const created = await prisma.bloodRequest.create({
      data: {
        requesterId: user.id, bloodGroup, units, hospital, division, district,
        upazila: clean(b.upazila) || null,
        patientName: clean(b.patientName) || null,
        contactPhone, urgency, neededBy, expiresAt,
        note: clean(b.note, 500) || null,
      },
      select: { id: true },
    });
    let alerted = 0;
    try {
      alerted = await alertDonors({
        id: created.id, requesterId: user.id, bloodGroup, units, hospital, district,
        upazila: clean(b.upazila) || null, urgency,
      });
    } catch (e) {
      console.error("[BLOOD_ALERT]", e);
    }
    return NextResponse.json({ success: true, id: created.id, alerted }, { status: 201 });
  } catch (e) {
    console.error("[BLOOD_REQ_POST]", e);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
