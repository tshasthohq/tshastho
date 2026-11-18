const fs = require('fs');
const file = 'src/app/pharmacy/medicines/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add strength to state if missing
if (!content.includes('strength: ""')) {
    content = content.replace(/useState\(\{/, 'useState({\n    strength: "",');
}

// 2. Replace the messy duplicated block
const brokenBlockRegex = /setFormData\(\{\s*name: med\.name[\s\S]*?supplier: med\.supplier \|\| "",\s*\}\);/g;

const fixedBlock = `setFormData({
      name: med.name || "", brand: med.brand || "", genericName: med.genericName || "",
      category: med.category || "", description: med.description || "",
      purchasePrice: String(med.purchasePrice || ""), sellingPrice: String(med.sellingPrice || ""), stock: String(med.stock || 0), strength: med.strength || "", unit: med.unit || "piece", expiryDate: med.expiryDate ? new Date(med.expiryDate).toISOString().split("T")[0] : "", batchNumber: med.batchNumber || "", lowStockAlert: String(med.lowStockAlert || 10),
      discountPercent: String(med.discountPercent || "0"), manufacturer: med.manufacturer || "",
      masterMedicineId: med.masterMedicineId || "", images: Array.isArray(med.images) ? med.images : [],
      barcode: med.barcode || "", supplier: med.supplier || ""
    });`;

content = content.replace(brokenBlockRegex, fixedBlock);
fs.writeFileSync(file, content);
console.log("✅ Errors fixed successfully!");
