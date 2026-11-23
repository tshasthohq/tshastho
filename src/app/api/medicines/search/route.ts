import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memo } from "@/lib/memo"; 

export async function POST(req: Request) {
  try {
    const { query, page = 1, limit = 40 } = await req.json();

    const where: any = { isActive: true };
    
    if (query && query.trim()) {
      where.OR = [
        { name: { startsWith: query, mode: "insensitive" } },
        { brand: { startsWith: query, mode: "insensitive" } },
        { genericName: { startsWith: query, mode: "insensitive" } },
      ];
    }

    const totalPromise = memo(`med-count:${JSON.stringify(where)}`, 60_000, () => prisma.medicine.count({ where }));
    const medicines = await prisma.medicine.findMany({
      relationLoadStrategy: "join",
      where,
      include: {
        pharmacy: {
          select: { 
            id: true, 
            shopName: true, 
            address: true, 
            area: true, 
            city: true, 
            deliveryRadius: true
            // isVerified সরিয়ে দেওয়া হলো, কারণ এটি হয়তো স্কিমাতে নেই
          },
        },
        branchStocks: {
          where: { quantity: { gt: 0 } },
          include: {
            branch: { select: { name: true, isMainBranch: true } }
          }
        }
      },
      take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
        orderBy: [
        { stock: 'desc' }, 
        { name: 'asc' }
      ],
    });

    type MasterRow = { id: string; name: string; brand: string | null; strength: string | null };
    const norm = (v: any) => String(v ?? "").trim().toLowerCase();
    const normStrength = (v: any) => norm(v).replace(/\s+/g, "");
    const nbKey = (m: any) => `${norm(m.name)}|${norm(m.brand)}`;
    const unlinked = medicines.filter((m: any) => !m.masterMedicineId);
    const pairSeen = new Set<string>();
    const pairs = unlinked
      .filter((m: any) => {
        const k = nbKey(m);
        if (pairSeen.has(k)) return false;
        pairSeen.add(k);
        return true;
      })
      .map((m: any) => ({ name: m.name, brand: m.brand ?? null }));
    const masters: MasterRow[] = pairs.length
      ? await memo(`master-nb:${JSON.stringify(pairs)}`, 300_000, () => prisma.masterMedicine.findMany({
          where: { OR: pairs },
          select: { id: true, name: true, brand: true, strength: true },
          orderBy: { id: "asc" },
        }))
      : [];
    const mastersByNB = new Map<string, MasterRow[]>();
    for (const x of masters) {
      const k = nbKey(x);
      mastersByNB.set(k, [...(mastersByNB.get(k) || []), x]);
    }
    const resolveMaster = (m: any): string | null => {
      if (m.masterMedicineId) return m.masterMedicineId;
      const list = mastersByNB.get(nbKey(m));
      if (!list || !list.length) return null;
      const exact = list.find((x) => x.strength && normStrength(x.strength) === normStrength(m.strength));
      const generic = list.find((x) => !x.strength);
      return (exact || generic || list[0]).id;
    };
    const masterIds = Array.from(
      new Set(medicines.map((m: any) => resolveMaster(m)).filter(Boolean))
    ) as string[];
    const ratingRows = masterIds.length
      ? await memo(`rating-agg:${masterIds.join(",")}`, 30_000, () => prisma.medicineReview.groupBy({
          by: ["masterMedicineId"],
          where: { masterMedicineId: { in: masterIds }, status: "PUBLISHED" },
          _avg: { rating: true },
          _count: { rating: true },
        }))
      : [];
    const ratingMap = new Map(ratingRows.map((r) => [r.masterMedicineId, r]));
    const withRatings = medicines.map((m: any) => {
      const mid = resolveMaster(m);
      const r = mid ? ratingMap.get(mid) : null;
      return { ...m, masterMedicineId: mid, avgRating: r?._avg.rating || 0, reviewCount: r?._count.rating || 0 };
    });

    const total = await totalPromise;
    return NextResponse.json({ medicines: withRatings, total, hasMore: (Number(page) * Number(limit)) < total }, { status: 200 });
  } catch (error) {
    console.error("Search API Error:", error); // টার্মিনালে আসল এরর দেখাবে
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
