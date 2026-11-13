import { BranchProvider } from "@/context/BranchContext";

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchProvider>
      {children}
    </BranchProvider>
  );
}
