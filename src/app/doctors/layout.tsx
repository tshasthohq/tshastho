import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  'Find Verified Doctors in Bangladesh | Tshastho',
  'Search and book verified doctors by specialty across Bangladesh. Video and in-person consultations.',
  "/doctors"
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
