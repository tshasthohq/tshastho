"use client";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import { api } from "@/components/blood-bank/Sheet";

const box =
  "w-full px-3 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500";

export default function PricesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api("/api/blood-bank/services", "GET");
      setItems(d.items || []);
      setEdit({});
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patch(id: string, body: any) {
    setBusy(id);
    setMsg("");
    try {
      await api("/api/blood-bank/services", "PATCH", { id, ...body });
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy("");
    }
  }

  async function add() {
    setBusy("new");
    setMsg("");
    try {
      await api("/api/blood-bank/services", "POST", { name, price: Number(price) || 0 });
      setName("");
      setPrice("");
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24" style={{ colorScheme: "light" }}>
      <BackHeader title="Service prices" />
      <div className="max-w-md mx-auto p-4 space-y-4">
        <p className="text-xs text-slate-500">
          Set your charges for services such as screening, grouping, crossmatch and processing. These appear on every invoice. Blood itself is never priced.
        </p>
        {msg && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{msg}</p>}

        {loading ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {items.map((i) => {
              const changed = edit[i.id] !== undefined && Number(edit[i.id]) !== i.price;
              return (
                <div key={i.id} className={`bg-white rounded-2xl border p-4 ${i.isActive ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
                  <p className="text-sm font-bold text-slate-900">{i.name}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm font-bold text-slate-500">৳</span>
                    <input type="number" className={box} value={edit[i.id] ?? String(i.price)} onChange={(e) => setEdit((p) => ({ ...p, [i.id]: e.target.value }))} />
                    {changed && (
                      <button disabled={busy === i.id} onClick={() => patch(i.id, { price: Number(edit[i.id]) })} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white disabled:opacity-60">Save</button>
                    )}
                    <button disabled={busy === i.id} onClick={() => patch(i.id, { isActive: !i.isActive })} className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 whitespace-nowrap disabled:opacity-60">
                      {i.isActive ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <p className="text-sm font-bold text-slate-900">Add a service</p>
          <input className={box} placeholder="Service name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="number" className={box} placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
          <button disabled={busy === "new"} onClick={add} className="w-full bg-slate-900 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <Plus size={16} /> Add service
          </button>
        </div>
      </div>
    </div>
  );
}
