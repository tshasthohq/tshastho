"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, X, User, Phone, Clock, CheckCircle, XCircle } from "lucide-react";

export default function SmsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"send" | "log">("send");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const [form, setForm] = useState({
    phone: "",
    message: "",
    templateKey: "",
  });

  const load = async () => {
    setLoading(true);
    const [lRes, tRes, cRes] = await Promise.all([
      fetch("/api/pharmacy/sms/send", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/sms/templates", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/customers/list", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]);
    setLogs(lRes.logs || []);
    setTemplates(tRes.templates || []);
    setCustomers(cRes.customers || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const pickTemplate = (key: string) => {
    const t = templates.find((x) => x.key === key);
    if (t) setForm({ ...form, templateKey: key, message: t.body });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone || !form.message) { setMessage("Phone and message required"); return; }
    setSending(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        phone: form.phone,
        message: form.message,
        customerId: selectedCustomer?.id,
        recipientName: selectedCustomer?.name,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setMessage("✅ Sent!");
      setForm({ phone: "", message: "", templateKey: "" });
      setSelectedCustomer(null);
      load();
      setTimeout(() => setMessage(""), 2500);
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "SENT": return "bg-green-100 text-green-700";
      case "DELIVERED": return "bg-blue-100 text-blue-700";
      case "FAILED": return "bg-red-100 text-red-700";
      case "BLOCKED": return "bg-slate-100 text-slate-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  const filteredCustomers = customers.filter(c =>
    !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)
  );

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">SMS</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("send")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            tab === "send" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>Send SMS</button>
        <button onClick={() => setTab("log")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            tab === "log" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>Log ({logs.length})</button>
      </div>

      {tab === "send" && (
        <form onSubmit={handleSend} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          {/* Customer picker */}
          {selectedCustomer ? (
            <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl">
              <User className="text-blue-600" size={18} />
              <div className="flex-1">
                <div className="text-sm font-medium">{selectedCustomer.name}</div>
                <div className="text-xs text-slate-500">{selectedCustomer.phone}</div>
              </div>
              <button type="button" onClick={() => { setSelectedCustomer(null); setForm({ ...form, phone: "" }); }}
                className="text-xs text-blue-600">Change</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowCustomerPicker(true)}
              className="w-full flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-3 text-slate-500">
              <User size={16} />
              <span className="text-sm">Choose customer (or type phone below)</span>
            </button>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Phone *</label>
            <input required value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Template</label>
            <select value={form.templateKey}
              onChange={(e) => pickTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
              <option value="">Custom message</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.key}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Message *</label>
            <textarea required value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            <p className="text-[10px] text-slate-500 mt-1">
              {form.message.length} characters ({Math.ceil(form.message.length / 160)} SMS)
            </p>
          </div>

          {message && <p className="text-sm text-center text-green-600">{message}</p>}

          <button type="submit" disabled={sending}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            <Send size={16} /> {sending ? "Sending..." : "Send SMS"}
          </button>
        </form>
      )}

      {tab === "log" && (
        loading ? (
          <div className="text-center text-slate-500 p-8">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
            No SMS sent yet.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white p-3 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <Phone size={10} /> <span className="font-mono">{log.phone}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(log.status)}`}>
                    {log.status}
                  </span>
                </div>
                <div className="text-xs text-slate-700 line-clamp-2">{log.message}</div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={9} />
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showCustomerPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Select Customer</h2>
              <button onClick={() => setShowCustomerPicker(false)}><X size={20} /></button>
            </div>
            <div className="p-4">
              <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-3" />
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredCustomers.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">No customers</p>
                ) : (
                  filteredCustomers.map((c: any) => (
                    <button key={c.id} type="button"
                      onClick={() => { setSelectedCustomer(c); setForm({ ...form, phone: c.phone || "" }); setShowCustomerPicker(false); }}
                      className="w-full text-left bg-slate-50 hover:bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.phone}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
