import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { parseGroup, eligibleWhere, clean } from "@/lib/blood";

export const dynamic = "force-dynamic";
const PAGE = 20;

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const group = parseGroup(sp.get("bloodGroup"));
    const district = clean(sp.get("district"));
    const upazila = clean(sp.get("upazila"));
    const page = Math.max(1, Number(sp.get("page")) || 1);

    const where = {
      ...eligibleWhere(),
      ...(group ? { bloodGroup: group } : {}),
      ...(district ? { district } : {}),
      ...(upazila ? { upazila } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.bloodDonor.findMany({
        where,
        select: {
          id: true, bloodGroup: true, district: true, upazila: true, area: true,
          totalDonations: true, verified: true, lastDonationDate: true,
          user: { select: { name: true } },
        },
        orderBy: [{ verified: "desc" }, { totalDonations: "desc" }],
        skip: (page - 1) * PAGE,
        take: PAGE,
      }),
      prisma.bloodDonor.count({ where }),
    ]);

    const donors = rows.map((d) => ({
      id: d.id,
      name: (d.user?.name || "Donor").split(" ")[0],
      bloodGroup: d.bloodGroup,
      district: d.district,
      upazila: d.upazila,
      area: d.area,
      totalDonations: d.totalDonations,
      verified: d.verified,
    }));

    return NextResponse.json(
      { donors, total, page, pages: Math.ceil(total / PAGE) },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (e) {
    console.error("[BLOOD_DONORS_GET]", e);
    return NextResponse.json({ error: "Failed to load donors" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const bloodGroup = parseGroup(b.bloodGroup);
    const division = clean(b.division);
    const district = clean(b.district);
    const gender = b.gender === "FEMALE" ? "FEMALE" : b.gender === "MALE" ? "MALE" : null;

    if (!bloodGroup || !division || !district || !gender)
      return NextResponse.json({ error: "Blood group, gender, division and district are required" }, { status: 400 });

    let lastDonationDate: Date | null = null;
    if (b.lastDonationDate) {
      lastDonationDate = new Date(b.lastDonationDate);
      if (isNaN(+lastDonationDate) || +lastDonationDate > Date.now())
        return NextResponse.json({ error: "Invalid last donation date" }, { status: 400 });
    }

    const data = {
      bloodGroup, gender, division, district,
      upazila: clean(b.upazila) || null,
      area: clean(b.area) || null,
      lastDonationDate,
      isAvailable: b.isAvailable !== false,
      showPhone: b.showPhone === true,
    };

    const existing = await prisma.bloodDonor.findUnique({
      where: { userId: user.id },
      select: { bloodGroup: true, lastDonationDate: true },
    });
    if (existing) {
      if (existing.bloodGroup !== bloodGroup)
        return NextResponse.json({ error: "Blood group cannot be changed after registration. Contact support if it was a mistake." }, { status: 409 });
      if (existing.lastDonationDate && (!lastDonationDate || +lastDonationDate < +existing.lastDonationDate))
        return NextResponse.json({ error: "Last donation date cannot be moved earlier." }, { status: 400 });
    }

    if (!existing && b.eligibleDeclared !== true)
      return NextResponse.json({ error: "Please confirm you meet the donor requirements" }, { status: 400 });

    const donor = await prisma.bloodDonor.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
      select: { id: true, bloodGroup: true, isAvailable: true, verified: true },
    });
    return NextResponse.json({ success: true, donor });
  } catch (e) {
    console.error("[BLOOD_DONOR_POST]", e);
    return NextResponse.json({ error: "Failed to save donor profile" }, { status: 500 });
  }
}
