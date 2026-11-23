import PublicHeader from "@/components/PublicHeader";

export default function HospitalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen pb-20 text-slate-900"
      style={{ background: "linear-gradient(180deg,#dbeafe 0%,#eff6ff 38%,#f8fafc 100%)" }}
    >
      <PublicHeader />
      {children}
    </div>
  );
}
