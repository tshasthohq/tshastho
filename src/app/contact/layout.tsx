import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  'Contact Tshastho | Hotline and Support',
  'Reach the Tshastho support team by phone, email or message.',
  "/contact"
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
