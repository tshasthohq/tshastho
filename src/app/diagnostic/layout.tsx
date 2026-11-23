import DiagnosticNav from "@/components/diagnostic/DiagnosticNav";

// Purono page gulor orange ke brand blue-teal e bodlay
const THEME = `
.diag .bg-orange-600{background-image:linear-gradient(135deg,#1d4ed8,#0891b2);background-color:#1d4ed8}
.diag .hover\\:bg-orange-700:hover{background-color:#1e40af}
.diag .text-orange-600,.diag .text-orange-700,.diag .text-orange-800{color:#1d4ed8}
.diag .bg-orange-50{background-color:#eff6ff}
.diag .border-orange-100{border-color:#dbeafe}
.diag .rounded-xl{border-radius:1rem}
.diag .shadow-sm{box-shadow:0 8px 30px rgba(15,23,42,.06)}
.diag .bg-orange-600.text-white,.diag .bg-orange-600 *{color:#fff}
`;

export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="diag min-h-screen bg-slate-50"
      style={{
        backgroundImage:
          "radial-gradient(60% 45% at 12% 0%, #dbeafe 0%, transparent 60%), radial-gradient(50% 40% at 92% 8%, #ccfbf1 0%, transparent 60%)",
      }}
    >
      <style>{THEME}</style>
      <DiagnosticNav />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
