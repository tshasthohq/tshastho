import { prisma } from "@/lib/prisma";
import { readToken } from "@/lib/diagnostic/verify";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify report | Tshastho", robots: { index: false, follow: false } };

const dt = (s: any) =>
  s ? new Date(s).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
const mask = (n?: string | null) =>
  (n || "").split(/\s+/).filter(Boolean).map((w) => w.charAt(0) + "*".repeat(Math.max(2, w.length - 1))).join(" ");
const KNOWN = ["MBBS", "BCS", "MD", "MS", "FCPS", "MCPS", "DCP", "FRCP", "MRCP", "FRCS", "BDS", "DMU"];
const fmtDegree = (s?: string | null) => {
  if (!s) return "";
  if (s.includes("(")) return s.replace(/[,\s]+$/, "");
  return s.split(/[,\s]+/).filter(Boolean).map((t) => (KNOWN.includes(t.toUpperCase()) ? t.toUpperCase() : t)).join(", ");
};

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-semibold text-slate-900">{v || "-"}</dd>
    </div>
  );
}

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tk = readToken(decodeURIComponent(token));
  let it: any = null;
  let center: any = null;
  if (tk) {
    it = await (prisma as any).diagnosticOrderItem.findUnique({
      where: { id: tk.id },
      include: { order: { include: { patient: true } } },
    });
    if (it?.order) center = await (prisma as any).diagnostic.findUnique({ where: { id: it.order.diagnosticId } });
  }
  const isVerified = !!it && (it.status === "VERIFIED" || it.status === "APPROVED") && it.order?.status !== "CANCELLED";
  const curV = Math.max(1, it?.reportVersion || 0);
  const superseded = isVerified && !!tk && tk.v < curV;
  const ok = isVerified && !superseded;
  const revising = !!it && !isVerified;
  const p = it?.order?.patient;
  const path = it?.signers?.pathologist;
  const hash = it?.reportHash ? String(it.reportHash).slice(0, 12).toUpperCase().replace(/(.{4})(?=.)/g, "$1-") : "";

  const tone = ok
    ? { bg: "bg-emerald-50", fg: "text-emerald-700", ring: "ring-emerald-200" }
    : revising
    ? { bg: "bg-amber-50", fg: "text-amber-700", ring: "ring-amber-200" }
    : { bg: "bg-red-50", fg: "text-red-700", ring: "ring-red-200" };

  const title = ok ? "Authentic report" : superseded ? "Superseded report" : revising ? "Report under revision" : "Could not verify";
  const text = ok
    ? "Ei report-ti ei diagnostic center theke verified hoye issue kora hoyeche."
    : superseded
    ? "Ei printed copy-ti purono version (v" + tk!.v + "). Notun version (v" + curV + ") issue hoyeche. Lab theke notun copy nin."
    : revising
    ? "Ei report-er result bodlano hocche. Printed copy ar valid na, notun copy nin."
    : "Ei QR code ti valid na ba bodlano hoyeche. Printed report-ti grohon korben na.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_rgba(15,23,42,0.10)]">
        <div className="h-1.5 bg-gradient-to-r from-blue-700 via-blue-500 to-teal-500" />
        <div className="p-6">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-8 ${tone.bg} ${tone.fg} ${tone.ring}`}>
            {ok ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
          </div>
          <h1 className={`mt-4 text-center text-xl font-black ${tone.fg}`}>{title}</h1>
          {ok && (
            <p className="mt-1 text-center">
              <span className={`rounded-full px-3 py-0.5 text-[11px] font-black ${curV > 1 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                {curV > 1 ? "AMENDED (v" + curV + ")" : "FINAL"}
              </span>
            </p>
          )}
          <p className="mt-2 text-center text-sm text-slate-500">{text}</p>

          {it && (
            <dl className="mt-5 rounded-2xl bg-slate-50 px-4 py-1">
              <Row k="Diagnostic center" v={center?.centerName} />
              <Row k="Test" v={it.testName} />
              <Row k="Report ID" v={it.order?.orderNo + "-" + it.testCode} />
              <Row k="Version" v={"v" + curV + (curV > 1 ? " (Amended)" : " (Final)")} />
              <Row k="Patient" v={mask(p?.name)} />
              <Row k="Age / Sex" v={p ? (p.age ? p.age + (p.ageUnit || "") : "-") + " / " + (p.gender || "-") : "-"} />
              <Row k="Sample collected" v={dt(it.sampleCollectedAt)} />
              <Row k="Reported" v={dt(it.verifiedAt)} />
              <Row k="Verified by" v={path ? [path.name, fmtDegree(path.degree)].filter(Boolean).join(", ") : it.verifiedBy} />
              {hash && <Row k="Document ID" v={hash} />}
            </dl>
          )}

          <p className="mt-4 text-center text-[11px] leading-4 text-slate-400">
            Privacy-r jonno result-er value ekhane dekhano hoy na. Printed report-er sathe ei tothyo milie nin.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
            <span>Verified with</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Tshastho" className="h-5 object-contain" />
          </div>
        </div>
      </div>
    </main>
  );
}
