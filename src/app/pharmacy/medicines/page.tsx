"use client";
import PermissionGuard from "@/components/staff/PermissionGuard";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Pill, Search, Edit, Trash2, X, Save, TrendingUp, Info, Library, Image as ImageIcon, Loader2, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function PharmacyMedicinesPageInner() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState(5);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    name: "", brand: "", genericName: "", category: "", description: "",
    purchasePrice: "", sellingPrice: "", discountPercent: "0",
    stock: "", unit: "piece", manufacturer: "",
    masterMedicineId: "", images: [] as string[],
    expiryDate: "", batchNumber: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  const loadMedicines = () => {
    const email = localStorage.getItem("userEmail");
    if (!email) { setLoading(false); return; }
    fetch("/api/pharmacy/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.medicines) setMedicines(data.medicines);
      if (data.platformFeePercent) setPlatformFee(data.platformFeePercent);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  useEffect(() => { loadMedicines(); }, []);

  useEffect(() => {
    if (!showCatalog) return;
    setCatalogLoading(true);
    const timer = setTimeout(() => {
      fetch("/api/master-medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: catalogSearch }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.medicines) setCatalogResults(data.medicines);
        setCatalogLoading(false);
      })
      .catch(() => setCatalogLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [catalogSearch, showCatalog]);

  const pickFromCatalog = (master: any) => {
    let displayName = master.name || "";
    if (master.strength && !displayName.includes(master.strength)) {
      displayName = displayName + " " + master.strength;
    }
    setFormData({
      ...formData,
      masterMedicineId: master.id,
      name: displayName.trim(),
      brand: master.brand || "",
      genericName: master.genericName || "",
      category: master.category || "",
      manufacturer: master.manufacturer || "",
      description: master.description || "",
    });
    setShowCatalog(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (med: any) => {
    setEditing(med);
    setFormData({
      name: med.name || "",
      brand: med.brand || "",
      genericName: med.genericName || "",
      category: med.category || "",
      description: med.description || "",
      purchasePrice: String(med.purchasePrice || ""),
      sellingPrice: String(med.sellingPrice || ""),
      discountPercent: String(med.discountPercent || "0"),
      stock: String(med.stock || ""),
      unit: med.unit || "piece",
      manufacturer: med.manufacturer || "",
      masterMedicineId: med.masterMedicineId || "",
      images: Array.isArray(med.images) ? med.images : [],
      expiryDate: med.expiryDate ? new Date(med.expiryDate).toISOString().split("T")[0] : "",
      batchNumber: med.batchNumber || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;
    await fetch("/api/pharmacy/medicines/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicineId: id, action: "delete" }),
    });
    loadMedicines();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (formData.images.length + files.length > 3) {
      setMessage("Maximum 3 images allowed");
      return;
    }
    setUploading(true);
    const uploaded: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const formDataToUpload = new FormData();
      formDataToUpload.append("file", files[i]);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formDataToUpload });
        const data = await res.json();
        if (res.ok && data.url) uploaded.push(data.url);
      } catch {}
    }
    setFormData({ ...formData, images: [...formData.images, ...uploaded] });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (url: string) => {
    setFormData({ ...formData, images: formData.images.filter(u => u !== url) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const email = localStorage.getItem("userEmail");
    let res;
    if (editing) {
      res = await fetch("/api/pharmacy/medicines/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: editing.id, ...formData }),
      });
    } else {
      res = await fetch("/api/pharmacy/medicines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...formData }),
      });
    }
    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Saved successfully!");
      setShowForm(false);
      setFormData(emptyForm);
      setEditing(null);
      loadMedicines();
      setTimeout(() => setMessage(""), 2500);
    } else {
      setMessage(data.message || "Failed");
    }
    setSaving(false);
  };

  const calc = useMemo(() => {
    const purchase = parseFloat(formData.purchasePrice) || 0;
    const selling = parseFloat(formData.sellingPrice) || 0;
    const discount = parseFloat(formData.discountPercent) || 0;
    const discountAmount = (selling * discount) / 100;
    const finalPrice = selling - discountAmount;
    const platformFeeAmount = (finalPrice * platformFee) / 100;
    const netEarning = finalPrice - purchase - platformFeeAmount;
    const marginPercent = purchase > 0 ? (netEarning / purchase) * 100 : 0;
    return { purchase, selling, discount, discountAmount, finalPrice, platformFeeAmount, netEarning, marginPercent };
  }, [formData, platformFee]);

  const filtered = medicines.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.brand?.toLowerCase().includes(search.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Cream", "Drops", "Inhaler", "Suspension", "Powder", "Lotion", "Gel", "Spray", "Suppository", "Shampoo", "Nebulizer", "Other"];
  const units = ["piece", "strip", "bottle", "box", "tube", "sachet", "vial", "ampoule"];

  const computeDisplay = (m: any) => {
    const selling = parseFloat(m.sellingPrice);
    const discount = parseFloat(m.discountPercent) || 0;
    const finalPrice = selling - (selling * discount) / 100;
    return { selling, discount, finalPrice };
  };

  const getImages = (m: any): string[] => {
    if (!m.images) return [];
    if (Array.isArray(m.images)) return m.images;
    return [];
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const nowDate = new Date();
    const exp = new Date(expiryDate);
    const daysLeft = Math.ceil((exp.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: "EXPIRED", color: "bg-red-100 text-red-700" };
    if (daysLeft <= 30) return { label: "Expires in " + daysLeft + "d", color: "bg-orange-100 text-orange-700" };
    if (daysLeft <= 90) return { label: "Expires in " + daysLeft + "d", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Exp " + exp.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">Medicines</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your medicines..." className="pl-10" />
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus size={16} /> Add
          </Button>
        </div>

        {message && !showForm && (
          <p className={"text-center text-sm font-medium mb-4 " + (message.includes("✅") ? "text-green-600" : "text-red-500")}>
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-slate-500 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
            <Pill size={64} className="mx-auto text-purple-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              {medicines.length === 0 ? "No medicines added yet" : "No results found"}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {medicines.length === 0 ? "Browse our 1000+ medicine catalog to add quickly" : "Try a different search"}
            </p>
            {medicines.length === 0 && (
              <Button onClick={handleAdd} className="inline-flex items-center gap-2">
                <Plus size={16} /> Add First Medicine
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((med) => {
              const d = computeDisplay(med);
              const imgs = getImages(med);
              const expStatus = getExpiryStatus(med.expiryDate);
              return (
                <div key={med.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-purple-100 flex items-center justify-center text-purple-600">
                      {imgs.length > 0 ? (
                        <img src={imgs[0]} alt={med.name} className="w-full h-full object-cover" />
                      ) : (
                        <Pill size={24} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-800 truncate">{med.name}</h3>
                          <p className="text-xs text-slate-500 truncate">
                            {med.brand ? med.brand + " • " : ""}{med.genericName || "No generic"}
                          </p>
                          {expStatus && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className={"text-[10px] px-2 py-0.5 rounded-full font-medium " + expStatus.color}>
                                {expStatus.label}
                              </span>
                              {med.batchNumber && (
                                <span className="text-[10px] text-slate-400">Batch: {med.batchNumber}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => handleEdit(med)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(med.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {imgs.length > 1 && (
                        <div className="flex gap-1 mt-2">
                          {imgs.slice(1).map((url, i) => (
                            <img key={i} src={url} alt="" className="w-8 h-8 rounded object-cover" />
                          ))}
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">Purchase</p>
                          <p className="font-medium text-slate-800">৳{parseFloat(med.purchasePrice).toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">Selling</p>
                          <p className="font-medium text-slate-800">৳{d.selling.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg">
                          <p className="text-green-700">Patient Pays</p>
                          <p className="font-bold text-green-700">৳{d.finalPrice.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">Stock</p>
                          <p className={"font-medium " + (med.stock > 10 ? "text-green-600" : med.stock > 0 ? "text-yellow-600" : "text-red-600")}>
                            {med.stock} {med.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto">
          <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-2xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-slate-800">{editing ? "Edit Medicine" : "Add New Medicine"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {!editing && (
                <button
                  type="button"
                  onClick={() => setShowCatalog(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90"
                >
                  <Library size={18} /> Browse 1000+ Medicine Catalog
                </button>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Medicine Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Napa Extend" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Brand</label>
                  <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="Beximco" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Generic Name</label>
                  <Input value={formData.genericName} onChange={(e) => setFormData({ ...formData, genericName: e.target.value })} placeholder="Paracetamol" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    <option value="">Select</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Manufacturer</label>
                  <Input value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} placeholder="Beximco Ltd." />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-medium text-slate-700 mb-2">Medicine Images (Max 3)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {formData.images.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                    </div>
                  ))}
                  {formData.images.length < 3 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500">
                      {uploading ? <Loader2 size={20} className="animate-spin" /> : <><ImageIcon size={20} /><span className="text-[10px] mt-1">Upload</span></>}
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-orange-600" /> Expiry & Batch
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date</label>
                    <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Batch / Lot No.</label>
                    <Input value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} placeholder="B2024A" />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} /> Pricing & Profit
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Purchase Price (৳) *</label>
                    <Input type="number" step="0.01" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} placeholder="1.50" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Selling Price (৳) *</label>
                    <Input type="number" step="0.01" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} placeholder="2.50" required />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Discount (%) — Optional</label>
                  <Input type="number" step="0.1" min="0" max="100" value={formData.discountPercent} onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })} placeholder="0" />
                </div>

                {calc.purchase > 0 && calc.selling > 0 && (
                  <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-800 font-bold text-sm mb-2">
                      <Info size={14} /> Live Profit Breakdown
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Selling Price:</span>
                      <span className="font-medium">৳{calc.selling.toFixed(2)}</span>
                    </div>
                    {calc.discount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Discount:</span>
                        <span className="font-medium text-red-500">− ৳{calc.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Patient Pays:</span>
                      <span className="font-bold text-slate-800">৳{calc.finalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Platform Fee ({platformFee}%):</span>
                      <span className="font-medium text-red-500">− ৳{calc.platformFeeAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Purchase Cost:</span>
                      <span className="font-medium text-red-500">− ৳{calc.purchase.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-green-200 flex justify-between text-sm">
                      <span className="font-bold text-green-800">Your Net Earning:</span>
                      <div className="text-right">
                        <p className="font-bold text-green-700">৳{calc.netEarning.toFixed(2)}</p>
                        <p className="text-xs text-green-600">({calc.marginPercent.toFixed(1)}% margin)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Stock *</label>
                  <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {units.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Short description..." rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              </div>

              {message && showForm && (
                <p className={"text-center text-sm font-medium " + (message.includes("✅") ? "text-green-600" : "text-red-500")}>{message}</p>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                <Save size={16} className="mr-2" />
                {saving ? "Saving..." : (editing ? "Update Medicine" : "Add Medicine")}
              </Button>
            </form>
          </div>
        </div>
      )}

      {showCatalog && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-2xl h-[85vh] md:h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Library size={20} className="text-purple-600" /> Medicine Catalog
              </h2>
              <button onClick={() => setShowCatalog(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search by name, brand, generic..."
                  className="pl-10"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {catalogLoading ? "Searching..." : catalogResults.length + " results found"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {catalogLoading ? (
                <div className="text-center py-12 text-slate-500">
                  <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                  <p>Loading...</p>
                </div>
              ) : catalogResults.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Library size={48} className="mx-auto text-slate-300 mb-4" />
                  <p>No medicines found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {catalogResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => pickFromCatalog(m)}
                      className="w-full text-left p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-100 hover:border-blue-200 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {m.name} {m.strength && <span className="text-blue-600">({m.strength})</span>}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {m.genericName || "No generic"} • {m.category || "N/A"}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {m.brand && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{m.brand}</span>}
                            {m.manufacturer && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate">{m.manufacturer}</span>}
                          </div>
                        </div>
                        <Plus size={18} className="text-blue-600 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// WRAPPED WITH PERMISSION GUARD
export default function PharmacyMedicinesPage() {
  return (
    <PermissionGuard permission={["view_medicines","add_medicines"]}>
      <PharmacyMedicinesPageInner />
    </PermissionGuard>
  );
}
