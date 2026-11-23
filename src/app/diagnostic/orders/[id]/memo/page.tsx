"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function Memo() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [fmt, setFmt] = useState<"thermal" | "a4">("thermal");

  useEffect(() => {
    if (!user) return;
    fetch(`/api/diagnostic/orders/${id}?memo=1`, { credentials: "include" }).then((r) => r.json())
      .then((d) => (d.success ? setData(d) : setErr(d.message || "Failed")))
      .catch(() => setErr("Failed to load"));
  }, [user, id]);

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;
  if (err) return <p className="p-6 text-red-600">{err}</p>;
  if (!data) return <p className="p-6 text-slate-500">Loading...</p>;

  const { order: o, center } = data;
  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const thermal = fmt === "thermal";

  return (
    <div>
      <style>{`@media print { @page { size: ${thermal ? "80mm auto" : "A4"}; margin: ${thermal ? "2mm" : "12mm"}; } body { background: #fff !important; } }`}</style>

      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <button onClick={() => setFmt("thermal")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${thermal ? "bg-orange-600 text-white" : "bg-white border border-slate-300 text-slate-700"}`}>80mm Thermal</button>
        <button onClick={() => setFmt("a4")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${!thermal ? "bg-orange-600 text-white" : "bg-white border border-slate-300 text-slate-700"}`}>A4</button>
        <button onClick={() => window.print()} className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-bold text-white">Print</button>
        <a href="/diagnostic/reception" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">New Order</a>
        <a href="/diagnostic/orders" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">Orders</a>
      </div>

      <div className={`mx-auto bg-white p-3 text-black ${thermal ? "w-[80mm] text-[11px]" : "w-full max-w-[210mm] text-sm p-6"}`}>
        <div className="text-center">
          <p className={`font-black ${thermal ? "text-sm" : "text-xl"}`}>{center.name}</p>
          <p>{center.address}, {center.city}</p>
          {center.phone && <p>Phone: {center.phone}</p>}
          <p className="mt-1 font-bold uppercase">Money Receipt</p>
        </div>
        <hr className="my-2 border-dashed border-black" />

        <div className={thermal ? "space-y-0.5" : "grid grid-cols-2 gap-x-6 gap-y-1"}>
          <p><b>Memo:</b> {o.orderNo}</p>
          <p><b>Date:</b> {fmtDate(o.createdAt)}</p>
          <p><b>Patient:</b> {o.patient.name} ({o.patient.patientNo})</p>
          <p><b>Age/Sex:</b> {o.patient.age ? `${o.patient.age}${o.patient.ageUnit}` : "-"} / {o.patient.gender || "-"}</p>
          {o.patient.phone && <p><b>Phone:</b> {o.patient.phone}</p>}
          <p><b>Ref:</b> {o.referrer ? o.referrer.name + (o.referrer.degree ? " (" + o.referrer.degree + ")" : "") : "Self"}</p>
        </div>
        <hr className="my-2 border-dashed border-black" />

        <table className="w-full">
          <thead><tr className="border-b border-black text-left"><th className="py-1">Test</th><th className="py-1 text-right">Price</th></tr></thead>
          <tbody>
            {o.items.map((i: any) => (
              <tr key={i.id}><td className="py-0.5 pr-2">{i.testName}{!thermal && <span className="text-xs text-gray-500"> ({i.testCode})</span>}</td><td className="py-0.5 text-right">{Number(i.price)}</td></tr>
            ))}
          </tbody>
        </table>
        <hr className="my-2 border-dashed border-black" />

        <div className="ml-auto w-full max-w-[260px] space-y-0.5">
          <p className="flex justify-between"><span>Subtotal</span><span>{Number(o.subtotal)}</span></p>
          <p className="flex justify-between"><span>Discount</span><span>{Number(o.discount)}</span></p>
          <p className="flex justify-between font-bold"><span>Total</span><span>{Number(o.total)}</span></p>
          <p className="flex justify-between"><span>Paid</span><span>{Number(o.paid)}</span></p>
          <p className="flex justify-between text-sm font-black"><span>Due</span><span>{Number(o.due)}</span></p>
        </div>
        <hr className="my-2 border-dashed border-black" />

        <p className="text-center">Report delivery: {fmtDate(o.items.reduce((m: any, i: any) => (i.promisedAt && (!m || new Date(i.promisedAt) > new Date(m)) ? i.promisedAt : m), null) || o.createdAt)}</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <Barcode value={o.orderNo} height={thermal ? 36 : 50} width={thermal ? 1.2 : 1.6} fontSize={11} margin={0} />
          <QRCodeSVG value={o.orderNo} size={thermal ? 56 : 72} />
        </div>
        <p className="mt-2 text-center text-[10px]">Thank you. Please bring this memo to collect your report.</p>
      </div>
    </div>
  );
}
