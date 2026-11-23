import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  'Order Medicines Online in Bangladesh | Tshastho',
  'Search medicines by name, brand or generic and order from trusted pharmacies with home delivery.',
  "/medicines"
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
