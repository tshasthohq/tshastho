"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Receipt, Download, User } from "lucide-react";

export default function VatInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/pharmacy/vat-invoices", { credentials: "include" })
      .then(r => r.json())
      .then(d => setInvoices(d.invoices || []))
      .finally(() => setLoading(false));
  }, [user]);

  const totalVat = invoices.reduce((s, i) => s + Number(i.vatAmount), 0);

  const downloadCsv = () => {
    const rows = [["Invoice #", "Date", "Customer", "Subtotal", "Discount", "VAT Rate", "VAT Amount", "Total"]];
    invoices.forEach((i) => {
      rows.push([
        i.invoiceNumber,
        new Date(i.invoiceDate).toLocaleDateString(),
        i.customerName || "",
        Number(i.subtotal).toFixed(2),
        Number(i.discount).toFixed(2),
        `${i.vatRate}%`,
        Number(i.vatAmount).toFixed(2),
        Number(i.totalAmount).toFixed(2),
      ]);
    });
    const csv = rows.map(r => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vat-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">VAT Invoices</h1>
        </div>
        {invoices.length > 0 && (
          <button onClick={downloadCsv}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Download size={14} /> CSV
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
        <div className="text-xs text-blue-700">Total VAT Collected</div>
        <div className="text-2xl font-bold text-blue-700">৳ {totalVat.toFixed(2)}</div>
        <div className="text-xs text-blue-600 mt-1">{invoices.length} invoices</div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No VAT invoices yet. Enable VAT in Tax Config to start tracking.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {invoices.map((i) => (
            <div key={i.id} className="p-3">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="font-mono text-xs text-slate-500">{i.invoiceNumber}</div>
                  {i.customerName && (
                    <div className="text-sm font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                      <User size={10} /> {i.customerName}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-0.5">
                    {i.order?.orderNumber || i.posSale?.saleNumber || "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">VAT {i.vatRate}%</div>
                  <div className="font-bold text-blue-600">৳{Number(i.vatAmount).toFixed(2)}</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                {new Date(i.invoiceDate).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
