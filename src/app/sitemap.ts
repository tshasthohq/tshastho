import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = "https://tshastho.com";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const paths = ["", "/doctors", "/medicines", "/about", "/contact", "/privacy", "/terms"];
  const items: MetadataRoute.Sitemap = paths.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
  try {
    const docs = await prisma.doctor.findMany({
      where: { verificationStatus: "VERIFIED" },
      select: { id: true },
      take: 1000,
    });
    for (const d of docs) {
      items.push({ url: `${BASE}/doctors/${d.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {}
  return items;
}
