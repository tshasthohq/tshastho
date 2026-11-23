import type { Metadata } from "next";

const BASE = "https://tshastho.com";

export function pageMeta(title: string, description: string, path: string): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE}${path}` },
    openGraph: { title, description, url: `${BASE}${path}`, siteName: "Tshastho", type: "website", images: ["/og-image.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] },
  };
}
