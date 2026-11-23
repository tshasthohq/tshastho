import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  'Privacy Policy | Tshastho',
  'How Tshastho collects, uses and protects your personal and health information.',
  "/privacy"
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
