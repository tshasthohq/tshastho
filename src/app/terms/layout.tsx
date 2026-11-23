import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  'Terms of Service | Tshastho',
  'The terms that apply when you use Tshastho.',
  "/terms"
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
