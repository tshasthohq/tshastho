"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Receipt, Save, AlertCircle, CheckCircle } from "lucide-react";

export default function TaxConfigPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    isVatRegistered: false,
    vatNumber: "",
    tinNumber: "",
    businessName: "",
    businessAddress: "",
    vatRate: 15,
    enableVatOnPos: false,
    enableVatOnOnline: false,
    invoicePrefix: "INV",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/tax-config", { credentials: "include" });
    const data = await res.json();
    if (data.config) {
      setForm({
        isVatRegistered: data.config.isVatRegistered || false,
        vatNumber: data.config.vatNumber || "",
        tinNumber: data.config.tinNumber || "",
        businessName: data.config.businessName || "",
        businessAddress: data.config.businessAddress || "",
        vatRate: Number(data.config.vatRate) || 15,
        enableVatOnPos: data.config.enableVatOnPos || false,
        enableVatOnOnline: data.config.enableVatOnOnline || false,
        invoicePrefix: data.config.invoicePrefix || "INV",
      });
    }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/tax-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMessage("✅ Settings saved!");
      setTimeout(() => setMessage(""), 2500);
    } else {
      setMessage(data.message || "Failed");
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Tax / VAT Setup</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isVatRegistered}
              onChange={(e) => setForm({ ...form, isVatRegistered: e.target.checked })}
              className="w-5 h-5" />
            <div>
              <div className="font-bold text-slate-800">VAT Registered</div>
              <div className="text-xs text-slate-500">Enable VAT calculation and invoices</div>
            </div>
          </label>
        </div>

        {form.isVatRegistered && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <h2 className="font-bold text-slate-800">Business Information</h2>
              <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Business / Pharmacy Name"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <textarea value={form.businessAddress} onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                rows={2} placeholder="Business Address"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                placeholder="VAT Registration Number (BIN)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono" />
              <input value={form.tinNumber} onChange={(e) => setForm({ ...form, tinNumber: e.target.value })}
                placeholder="TIN Number"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <h2 className="font-bold text-slate-800">VAT Settings</h2>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">VAT Rate (%)</label>
                <input type="number" min={0} max={50} step="0.01" value={form.vatRate}
                  onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Invoice Prefix</label>
                <input value={form.invoicePrefix} onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                  placeholder="INV"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.enableVatOnPos}
                  onChange={(e) => setForm({ ...form, enableVatOnPos: e.target.checked })} />
                Apply VAT on POS sales
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.enableVatOnOnline}
                  onChange={(e) => setForm({ ...form, enableVatOnOnline: e.target.checked })} />
                Apply VAT on online orders
              </label>
            </div>
          </>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-700">
          <AlertCircle size={12} className="inline mr-1" />
          Ensure your VAT/TIN numbers are correct for NBR compliance.
        </div>

        {message && <p className="text-sm text-center text-green-600">{message}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
          <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
