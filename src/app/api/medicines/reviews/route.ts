import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";

export const dynamic = "force-dynamic";

// Only customers whose order reached one of these statuses may review.
const REVIEWABLE = ["DELIVERED", "COMPLETED"];

function maskName(n?: string | null) {
  const p = (n || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "Anonymous";
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
}

async function findPurchasedOrder(userId: string, masterMedicineId: string) {
  const master = await prisma.masterMedicine.findUnique({ where: { id: masterMedicineId } });
  if (!master) return null;
  const meds = await prisma.medicine.findMany({
    where: {
      OR: [
        { masterMedicineId },
        { name: master.name, brand: master.brand ?? null, ...(master.strength ? { strength: { equals: master.strength, mode: "insensitive" as const } } : {}) },
      ],
    },
    select: { id: true },
  });
  if (!meds.length) return null;
  const item = await prisma.orderItem.findFirst({
    where: {
      medicineId: { in: meds.map((m) => m.id) },
      order: { patientId: userId, status: { in: REVIEWABLE } },
    },
    select: { orderId: true },
  });
  return item?.orderId ?? null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const masterMedicineId = searchParams.get("masterMedicineId");
    if (!masterMedicineId) {
      return NextResponse.json({ error: "masterMedicineId required" }, { status: 400 });
    }
    const where = { masterMedicineId, status: "PUBLISHED" };
    const [reviews, agg] = await Promise.all([
      prisma.medicineReview.findMany({
        where,
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.medicineReview.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    let canReview = false;
    let myReview: any = null;
    const user = await getCurrentUser();
    if (user) {
      myReview = await prisma.medicineReview.findUnique({
        where: { masterMedicineId_customerId: { masterMedicineId, customerId: user.id } },
      });
      canReview = !myReview && !!(await findPurchasedOrder(user.id, masterMedicineId));
    }

    return NextResponse.json({
      success: true,
      avgRating: agg._avg.rating || 0,
      reviewCount: agg._count.rating || 0,
      canReview,
      myReview,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVerified: r.isVerified,
        createdAt: r.createdAt,
        name: maskName(r.customer?.name),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const masterMedicineId = String(body.masterMedicineId || "");
    const rating = Number(body.rating);
    const title = body.title ? String(body.title).trim().slice(0, 100) : null;
    const comment = body.comment ? String(body.comment).trim().slice(0, 1000) : null;

    if (!masterMedicineId) {
      return NextResponse.json({ error: "masterMedicineId required" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const existing = await prisma.medicineReview.findUnique({
      where: { masterMedicineId_customerId: { masterMedicineId, customerId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this medicine." }, { status: 400 });
    }

    const orderId = await findPurchasedOrder(user.id, masterMedicineId);
    if (!orderId) {
      return NextResponse.json(
        { error: "Only customers who received this medicine can review it." },
        { status: 403 }
      );
    }

    const review = await prisma.medicineReview.create({
      data: { masterMedicineId, customerId: user.id, orderId, rating, title, comment, isVerified: true },
    });
    return NextResponse.json({ success: true, review });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
