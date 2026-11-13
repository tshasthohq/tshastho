"use client";

import PermissionGuard from "@/components/staff/PermissionGuard";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Pill, Search, Edit, Trash2, X, Save, TrendingUp, 
  Info, Library, Image as ImageIcon, Loader2, Calendar, AlertTriangle, 
  Clock, Package 
, TrendingDown , Barcode , ShoppingCart , CheckCircle , Sliders } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/context/BranchContext";
import * as XLSX from "xlsx";
import BarcodeGenerator from "react-barcode";
import { Tag, Printer, Camera } from "lucide-react";
import CameraScanner from "@/components/pharmacy/CameraScanner";
import { Download, Upload } from "lucide-react";

function PharmacyMedicinesPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "low" | "expiring" | "expired">("all");
  
  // Modal States
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState(5);
  
  // Catalog States
  const [showCatalog, setShowCatalog] = useState(false);
  const [historyModal, setHistoryModal] = useState<any>(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelMed, setLabelMed] = useState<any>(null);
  const [adjustMed, setAdjustMed] = useState<any>(null);
  const [adjustNewStock, setAdjustNewStock] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustType, setAdjustType] = useState("DAMAGE");
  const [selectedPOMed, setSelectedPOMed] = useState<any>(null);
  const [poQuantity, setPoQuantity] = useState("");
  const [poSupplier, setPoSupplier] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  
  // Image Upload States
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    name: "", brand: "", genericName: "", category: "", description: "",
    purchasePrice: "", sellingPrice: "", discountPercent: "0",
    stock: "", unit: "piece", manufacturer: "",
    masterMedicineId: "", images: [] as string[],
    expiryDate: "", batchNumber: "", lowStockAlert: "10", barcode: "", supplier: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  
  useEffect(() => {
    fetch("/api/pharmacy/suppliers", { credentials: "include" })
      .then(res => res.json())
      .then(data => { if (data.suppliers) setSuppliersList(data.suppliers); })
      .catch(console.error);
  }, [user]);

  const loadMedicines = () => {
    setLoading(true);
    fetch("/api/pharmacy/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ branchId: activeBranch?.id })
      })
      .then(res => res.json())
      .then(data => {
        if (data.medicines) setMedicines(data.medicines);
        if (data.pharmacy) setPharmacy(data.pharmacy);
        if (data.platformFeePercent) setPlatformFee(data.platformFeePercent);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadMedicines(); }, [activeBranch?.id]);

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

  
  
  const handleCameraScan = (scannedCode: string) => {
    setShowCamera(false);
    setBarcodeInput(scannedCode);
    const found = medicines.find(m => m.barcode === scannedCode || m.id.slice(0, 10).toUpperCase() === scannedCode);
    if (found) {
      setSearch(found.name);
    } else {
      alert("No medicine found with this barcode!");
    }
  };

  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = medicines.find(m => m.barcode === barcodeInput.trim());
    if (found) {
      setSearch(found.name);
      setBarcodeInput("");
    } else {
      alert("No medicine found with this barcode!");
      setBarcodeInput("");
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poQuantity || Number(poQuantity) <= 0) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/pharmacy/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName: poSupplier,
          items: [{
            medicineId: selectedPOMed.id,
            quantity: Number(poQuantity),
            unitCost: Number(selectedPOMed.purchasePrice) || 0,
            batchNumber: selectedPOMed.batchNumber
          }]
        })
      });
      if (res.ok) {
        alert("✅ Purchase Order generated successfully!");
        setShowPOModal(false);
        setPoQuantity("");
        setPoSupplier("");
      } else {
        alert("Failed to create PO");
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustNewStock || !adjustReason) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pharmacy/medicines/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineId: adjustMed.id,
          newStock: Number(adjustNewStock),
          reason: adjustReason,
          type: adjustType
        })
      });
      if (res.ok) {
        setShowAdjustModal(false);
        setAdjustReason("");
        loadMedicines();
      } else {
        alert("Failed to adjust stock");
      }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const fetchHistory = async (med: any) => {
    setHistoryModal(med);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/pharmacy/medicines/history?medicineId=${med.id}`);
      const data = await res.json();
      if (data.success) setHistoryData(data.history);
    } catch (e) {
      console.error(e);
    }
    setLoadingHistory(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (med: any) => {
    setEditing(med);
    setFormData({
      name: med.name || "", brand: med.brand || "", genericName: med.genericName || "",
      category: med.category || "", description: med.description || "",
      purchasePrice: String(med.purchasePrice || ""), sellingPrice: String(med.sellingPrice || ""),
      discountPercent: String(med.discountPercent || "0"), stock: String(med.stock || ""),
      unit: med.unit || "piece", manufacturer: med.manufacturer || "",
      masterMedicineId: med.masterMedicineId || "", images: Array.isArray(med.images) ? med.images : [],
      expiryDate: med.expiryDate ? new Date(med.expiryDate).toISOString().split("T")[0] : "",
      batchNumber: med.batchNumber || "",
      lowStockAlert: String(med.lowStockAlert || 10),
      barcode: med.barcode || "",
      supplier: med.supplier || "",
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

  // Quick Stock Update
  const updateStock = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    // Optimistic UI update
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, stock: newStock } : m));
    try {
      await fetch("/api/pharmacy/medicines/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: id, action: "update_stock", stock: newStock }),
      });
    } catch (e) {
      console.error(e);
      loadMedicines(); // Revert on failure
    }
  };

  
  // ====== Bulk Import / Export Logic ======
  const handleExport = () => {
    const exportData = medicines.map(m => ({
      Name: m.name,
      Brand: m.brand,
      Generic: m.genericName,
      Category: m.category,
      PurchasePrice: Number(m.purchasePrice),
      SellingPrice: Number(m.sellingPrice),
      Stock: m.stock,
      Unit: m.unit,
      BatchNumber: m.batchNumber,
      ExpiryDate: m.expiryDate ? new Date(m.expiryDate).toISOString().split('T')[0] : "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "Pharmacy_Inventory.xlsx");
  };

  const downloadTemplate = () => {
    const template = [{
      Name: "Napa Extend", Brand: "Beximco", Generic: "Paracetamol", Category: "Tablet",
      PurchasePrice: 1.5, SellingPrice: 2.5, Stock: 100, Unit: "Piece", BatchNumber: "B2024X", ExpiryDate: "2025-12-31"
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Import_Template.xlsx");
  };

  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const res = await fetch("/api/pharmacy/medicines/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ medicines: data }),
        });
        
        const resData = await res.json();
        if (res.ok) {
          alert(resData.message);
          loadMedicines();
        } else {
          alert(resData.message || "Import failed");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file");
      } finally {
        setLoading(false);
        if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };
  // =======================================

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (formData.images.length + files.length > 3) { setMessage("Maximum 3 images allowed"); return; }
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
    const email = user?.email;
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

  // Calculations for UI
  const calculateFinancials = (m: any) => {
    const selling = parseFloat(m.sellingPrice) || 0;
    const discount = parseFloat(m.discountPercent) || 0;
    const finalPrice = selling - (selling * discount / 100);
    return { selling, discount, finalPrice };
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const now = new Date();
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: "EXPIRED", color: "bg-red-100 text-red-700 border-red-200" };
    if (daysLeft <= 30) return { label: "Expires in " + daysLeft + "d", color: "bg-orange-100 text-orange-700 border-orange-200" };
    if (daysLeft <= 90) return { label: "Expires in " + daysLeft + "d", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    return { label: "Safe", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  };

  // Filtering Logic
  const filteredMedicines = useMemo(() => {
    let filtered = medicines.filter(m =>
      !search || m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.brand?.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName?.toLowerCase().includes(search.toLowerCase())
    );

    if (activeFilter === "low") {
      filtered = filtered.filter(m => m.stock > 0 && m.stock <= (m.lowStockAlert || 10));
    } else if (activeFilter === "expiring") {
      filtered = filtered.filter(m => {
        if (!m.expiryDate) return false;
        const daysLeft = Math.ceil((new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 90;
      });
    } else if (activeFilter === "expired") {
      filtered = filtered.filter(m => m.expiryDate && new Date(m.expiryDate) < new Date());
    }

    return filtered;
  }, [medicines, search, activeFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <style jsx global>{`
        @media print {
          @page { margin: 0; }
          
          /* মেইন বডি এবং স্ক্রিন হাইট লক করা */
          body, html { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important; 
            overflow: hidden !important;
            height: 100% !important;
          }
          
          /* Hide everything */
          body * { visibility: hidden; }
          
          /* Force main wrappers to collapse to 0 height */
          .min-h-screen { min-height: 0 !important; height: 0 !important; padding: 0 !important; margin: 0 !important; }
          
          /* The Modal Wrapper */
          .print-modal-wrapper {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            display: block !important;
            z-index: 9999 !important;
          }
          
          /* Reset the inner card */
          .print-modal-wrapper > div {
            visibility: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 0 !important; /* Prevent height spillover */
          }

          /* Show the label */
          #barcode-label, #barcode-label * { visibility: visible !important; }
          
          /* Position label exactly where we want it */
          #barcode-label { 
            position: absolute !important;
            left: 50% !important;
            top: 15mm !important; 
            transform: translateX(-50%) !important;
            width: 60mm !important; 
            padding: 10px !important;
            border: 1px dashed #000 !important;
            border-radius: 8px !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            height: auto !important; /* Reset height */
          }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Package className="text-indigo-600" size={20}/> Inventory <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md ml-2 align-middle">{activeBranch?.name}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadTemplate} className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors" title="Download Template">
              <Download size={14} /> Template
            </button>
            <button onClick={() => bulkFileInputRef.current?.click()} className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-200 transition-colors">
              <Upload size={14} /> Import
            </button>
            <button onClick={handleExport} className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 transition-colors">
              <Download size={14} /> Export
            </button>
            <button onClick={handleAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all">
              <Plus size={16} /> Add
            </button>
            <input type="file" ref={bulkFileInputRef} accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} className="hidden" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-5">
        
        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, brand, or generic..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button type="button" onClick={() => setShowCamera(true)} className="px-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors" title="Scan with Camera">
                <Camera size={20} />
              </button>
              <form onSubmit={handleBarcodeSearch} className="relative flex-1 md:w-64">
              <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
              <input 
                value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode..." 
                className="w-full pl-12 pr-4 py-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-indigo-400" 
              />
            </form>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {[
              { key: "all", label: "All Medicines", icon: <Library size={14}/>, count: medicines.length },
              { key: "low", label: "Low Stock", icon: <AlertTriangle size={14}/>, count: medicines.filter(m => m.stock > 0 && m.stock <= (m.lowStockAlert || 10)).length },
              { key: "expiring", label: "Expiring Soon", icon: <Clock size={14}/>, count: medicines.filter(m => {
                if (!m.expiryDate) return false;
                const d = Math.ceil((new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000*60*60*24));
                return d > 0 && d <= 90;
              }).length },
              { key: "expired", label: "Expired", icon: <X size={14}/>, count: medicines.filter(m => m.expiryDate && new Date(m.expiryDate) < new Date()).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  activeFilter === tab.key 
                    ? "bg-slate-800 text-white border-slate-800 shadow-md" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.icon} {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md ml-1 ${activeFilter === tab.key ? "bg-white/20" : "bg-slate-100"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Medicines List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-2xl"></div>)}
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm mt-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill className="text-slate-300" size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No medicines found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedicines.map((med) => {
              const d = calculateFinancials(med);
              const expStatus = getExpiryStatus(med.expiryDate);
              const img = med.images?.[0];

              return (
                <div key={med.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                        {img ? <img src={img} alt={med.name} className="w-full h-full object-cover" /> : <Pill className="text-indigo-400" size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base leading-tight">{med.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{med.brand || med.genericName || "No generic"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => fetchHistory(med)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors" title="View History">
                        <Clock size={16} />
                      </button>
                      <button onClick={() => { setAdjustMed(med); setAdjustNewStock(String(med.stock)); setShowAdjustModal(true); }} className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors" title="Adjust Stock">
                        <Sliders size={16} />
                      </button>
                      <button onClick={() => { setSelectedPOMed(med); setPoQuantity(String(med.lowStockAlert * 2)); setShowPOModal(true); }} className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors" title="Generate Purchase Order">
                        <ShoppingCart size={16} />
                      </button>
                      <button onClick={() => { setLabelMed(med); setShowLabelModal(true); }} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors" title="Print Label">
                        <Tag size={16} />
                      </button>
                      <button onClick={() => handleEdit(med)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(med.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {expStatus && (pharmacy?.expiryAlert !== false) && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${expStatus.color}`}>
                        {expStatus.label}
                      </span>
                    )}
                    {med.stock <= (med.lowStockAlert || 10) && (pharmacy?.lowStockAlert !== false) && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-orange-100 text-orange-700 border-orange-200">
                        LOW STOCK
                      </span>
                    )}
                    {med.batchNumber && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        Batch: {med.batchNumber}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Price</p>
                      <p className="font-bold text-slate-800 text-sm">৳{d.finalPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Stock</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateStock(med.id, med.stock - 1)} disabled={med.stock <= 0} className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-50 text-lg font-bold leading-none">-</button>
                        <span className={`font-bold text-sm w-8 text-center ${(med.stock <= (med.lowStockAlert || 10) && pharmacy?.lowStockAlert !== false) ? 'text-red-500' : 'text-slate-800'}`}>{med.stock}</span>
                        <button onClick={() => updateStock(med.id, med.stock + 1)} className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-lg font-bold leading-none">+</button>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Unit</p>
                       <p className="font-semibold text-slate-700 text-xs capitalize">{med.unit}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="font-bold text-slate-800 text-lg">{editing ? "Edit Medicine" : "Add New Medicine"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Catalog Button (Only for New) */}
              {!editing && (
                <button type="button" onClick={() => setShowCatalog(true)} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                  <Library size={18} /> Browse Medicine Catalog
                </button>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Medicine Name *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="e.g. Napa Extend" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Brand</label>
                    <input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="Beximco" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Generic</label>
                    <input value={formData.genericName} onChange={(e) => setFormData({ ...formData, genericName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="Paracetamol" />
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Purchase Price (৳) *</label>
                  <input type="number" step="0.01" required value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="1.50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Selling Price (৳) *</label>
                  <input type="number" step="0.01" required value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="2.50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Stock *</label>
                  <input type="number" required value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="100" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Low Stock Alert (Qty)</label>
                  <input type="number" required value={formData.lowStockAlert} onChange={(e) => setFormData({ ...formData, lowStockAlert: e.target.value })} className="w-full px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-900 font-bold focus:bg-white outline-none" placeholder="e.g. 10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Unit</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none">
                    {["Tablet", "Capsule", "Syrup", "Injection", "Piece", "Box", "Bottle", "Tube", "Sachet", "Vial", "Ampoule"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Barcode</label>
                  <input value={formData.barcode || ""} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="Scan or type" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Supplier / Vendor</label>
                  <select value={formData.supplier || ""} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none">
                    <option value="">Select Supplier (Optional)</option>
                    {suppliersList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Expiry */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Expiry Date</label>
                  <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Batch No.</label>
                  <input value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" placeholder="B2024A" />
                </div>
              </div>

              {/* Images */}
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-600 mb-2 block">Medicine Images (Max 3)</label>
                <div className="flex gap-2 flex-wrap">
                  {formData.images.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(url)} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-bl-lg">×</button>
                    </div>
                  ))}
                  {formData.images.length < 3 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors bg-slate-50">
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <><ImageIcon size={16} /><span className="text-[9px] mt-1 font-bold">Upload</span></>}
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </div>

              {message && <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</div>}

              <button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                <Save size={18} /> {saving ? "Saving..." : (editing ? "Update Medicine" : "Add Medicine")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Catalog Modal (Keep this as it was, no changes needed) */}
      {showCatalog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end md:items-center justify-center p-0 md:p-4">
           <div className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl h-[85vh] md:h-[80vh] flex flex-col">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between">
               <h2 className="font-bold text-slate-800 flex items-center gap-2"><Library size={20} className="text-purple-600" /> Medicine Catalog</h2>
               <button onClick={() => setShowCatalog(false)} className="p-2 bg-slate-100 rounded-lg"><X size={20} /></button>
             </div>
             <div className="p-3 border-b border-slate-100">
               <input value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} placeholder="Search by name..." className="w-full pl-4 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />
             </div>
             <div className="flex-1 overflow-y-auto p-3">
               {catalogLoading ? <div className="text-center py-10 text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" />Loading...</div> : (
                 catalogResults.length === 0 ? <div className="text-center py-10 text-slate-500"><Library size={32} className="mx-auto mb-2 text-slate-300" />No medicines found</div> :
                 <div className="space-y-2">
                   {catalogResults.map(m => (
                     <button key={m.id} onClick={() => pickFromCatalog(m)} className="w-full text-left p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl transition-colors flex items-start justify-between gap-2">
                       <div>
                         <p className="font-semibold text-slate-800 text-sm">{m.name} <span className="text-indigo-600 text-xs">{m.strength && `(${m.strength})`}</span></p>
                         <p className="text-xs text-slate-500">{m.genericName || "No generic"} • {m.category || "N/A"}</p>
                       </div>
                       <Plus size={18} className="text-indigo-600 flex-shrink-0 mt-1" />
                     </button>
                   ))}
                 </div>
               )}
             </div>
           </div>
        </div>
      )}
    
      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl h-[70vh] md:h-auto md:max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Stock History</h2>
                <p className="text-xs text-slate-500 font-medium">{historyModal.name}</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {loadingHistory ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No history found for this medicine.</div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {historyData.map((h, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-white shadow shrink-0 z-10 ${h.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {h.quantity > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </div>
                      <div className="w-[calc(100%-3rem)] bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-bold text-sm ${h.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {h.quantity > 0 ? '+' : ''}{h.quantity} {h.type}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-600">Prev: {h.previousStock} → New: {h.newStock}</div>
                        <div className="text-[10px] text-slate-400 mt-1">By: {h.user?.name || 'System'} • {h.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Order Modal */}
      {showPOModal && selectedPOMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <ShoppingCart className="text-purple-600" size={20} /> Create Purchase Order
              </h2>
              <button onClick={() => setShowPOModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18}/></button>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
              <p className="font-bold text-slate-800">{selectedPOMed.name}</p>
              <p className="text-xs text-slate-500">Current Stock: {selectedPOMed.stock} {selectedPOMed.unit}</p>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Order Quantity *</label>
                <input type="number" required value={poQuantity} onChange={(e) => setPoQuantity(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:bg-white outline-none" placeholder="e.g. 100" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Supplier / Vendor (Optional)</label>
                <select value={poSupplier} onChange={(e) => setPoSupplier(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none">
                    <option value="">Select Supplier (Optional)</option>
                    {suppliersList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-800 font-medium">Estimated Cost:</p>
                <p className="text-lg font-black text-purple-700">৳{((Number(poQuantity) || 0) * (Number(selectedPOMed.purchasePrice) || 0)).toFixed(2)}</p>
              </div>

              <button type="submit" disabled={saving} className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-colors flex items-center justify-center gap-2">
                <CheckCircle size={18} /> {saving ? "Creating..." : "Confirm Order"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && adjustMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Sliders className="text-slate-600" size={20} /> Adjust Stock
              </h2>
              <button onClick={() => setShowAdjustModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18}/></button>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">{adjustMed.name}</p>
                <p className="text-xs text-slate-500">Current Stock: {adjustMed.stock} {adjustMed.unit}</p>
              </div>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Adjustment Type</label>
                <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white outline-none">
                  <option value="DAMAGE">Damage / Broken</option>
                  <option value="EXPIRED">Expired / Lost</option>
                  <option value="ADJUSTMENT">Manual Correction</option>
                  <option value="PURCHASE">Received without PO</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">New Stock Quantity *</label>
                <input type="number" required value={adjustNewStock} onChange={(e) => setAdjustNewStock(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:bg-white outline-none" placeholder="e.g. 50" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Reason / Notes *</label>
                <textarea required value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white outline-none resize-none" placeholder="e.g. 5 tablets broken during transport" />
              </div>
              
              <button type="submit" disabled={saving} className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-500/20 transition-colors flex items-center justify-center gap-2">
                <CheckCircle size={18} /> {saving ? "Adjusting..." : "Confirm Adjustment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Modal */}
      {showLabelModal && labelMed && (
        <div className="print-modal-wrapper fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 print:shadow-none print:w-full print:max-w-none">
            
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Tag className="text-emerald-600" size={20} /> Print Label
              </h2>
              <button onClick={() => setShowLabelModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18}/></button>
            </div>

            {/* Sticker Area */}
            <div id="barcode-label" className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white">
              <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{labelMed.name}</h3>
              <p className="text-[10px] text-slate-500 mb-2">{labelMed.brand || labelMed.genericName}</p>
              
              <div className="text-xl font-black text-indigo-600 mb-2">
                ৳{Number(labelMed.sellingPrice).toFixed(2)}
              </div>

              {/* React Barcode Component */}
              <BarcodeGenerator value={labelMed.barcode || labelMed.id.slice(0, 10).toUpperCase()} 
                width={1.5} 
                height={40} 
                fontSize={12} 
                margin={0}
              />
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <button onClick={() => window.print()} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                <Printer size={18} /> Print Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraScanner 
          onScan={handleCameraScan} 
          onClose={() => setShowCamera(false)} 
        />
      )}
</div>
  );
}

export default function PharmacyMedicinesPage() {
  return (
    <PermissionGuard permission={["view_medicines", "add_medicines"]}>
      <PharmacyMedicinesPageInner />
    </PermissionGuard>
  );
}
