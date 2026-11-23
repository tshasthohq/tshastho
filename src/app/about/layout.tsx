import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  'About Tshastho | Connected Healthcare. Trusted Care.',
  'Learn about Tshastho, the connected healthcare platform linking patients, doctors, pharmacies and hospitals in Bangladesh.',
  "/about"
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
