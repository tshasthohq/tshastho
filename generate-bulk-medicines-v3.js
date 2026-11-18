require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY .env ফাইলে পাওয়া যায়নি!");
  process.exit(1);
}

const TOTAL_MEDICINES = 500;
const BATCH_SIZE = 10; 
const TOTAL_BATCHES = TOTAL_MEDICINES / BATCH_SIZE;

async function fetchBatch(batchNumber) {
  // 🔥 v1beta থেকে v1 করা হলো এবং gemini-1.5-flash দেওয়া হলো
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
  const prompt = `You are an expert pharmacist in Bangladesh. 
  Generate a JSON object with exactly one key "medicines", which contains an array of exactly 10 highly common medicines used in Bangladesh (Batch ${batchNumber} of ${TOTAL_BATCHES}). 
  Each medicine object must have exactly these keys: 
  "name" (string, e.g., Napa 500mg), 
  "brand" (string, e.g., Beximco), 
  "genericName" (string, e.g., Paracetamol), 
  "category" (string, e.g., Analgesic, Antibiotic), 
  "uses" (string, 1-2 sentences), 
  "dosage" (string, 1 sentence), 
  "sideEffects" (string, 1 sentence), 
  "warnings" (string, 1 sentence).
  Do not use markdown formatting like \`\`\`json. Return ONLY the raw JSON object.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
      console.error(`🚨 GOOGLE API ERROR IN BATCH ${batchNumber}:`);
      console.error(JSON.stringify(data, null, 2));
      return null;
    }

    let text = data.candidates[0].content.parts[0].text;
    
    // 🔥 সেফটি চেক: এআই যদি ভুল করে মার্কডাউন (```json) দিয়ে ফেলে, তবে তা সরানো হবে
    if (text.includes("```json")) {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    
    const parsed = JSON.parse(text);
    return parsed.medicines;
  } catch (error) {
    console.error(`❌ Parsing Error in Batch ${batchNumber}:`, error.message);
    return null;
  }
}

async function startBulkGeneration() {
  console.log(`🚀 Starting FINAL AI Generation for ${TOTAL_MEDICINES} Medicines...\n`);
  let totalInserted = 0;

  for (let i = 1; i <= TOTAL_BATCHES; i++) {
    console.log(`\n📦 [Batch ${i}/${TOTAL_BATCHES}] Requesting 10 medicines from AI...`);
    
    const medicines = await fetchBatch(i);
    
    if (medicines && Array.isArray(medicines)) {
      let batchInserted = 0;
      
      for (const med of medicines) {
        const existing = await prisma.masterMedicine.findFirst({
          where: { name: med.name, brand: med.brand }
        });

        if (!existing) {
          await prisma.masterMedicine.create({
            data: {
              name: med.name,
              brand: med.brand,
              genericName: med.genericName,
              category: med.category,
              uses: med.uses,
              dosage: med.dosage,
              sideEffects: med.sideEffects,
              warnings: med.warnings,
              imageUrl: "https://placehold.co/400x400/f8fafc/4f46e5?text=Medicine"
            }
          });
          batchInserted++;
          totalInserted++;
        }
      }
      console.log(`✅ Batch ${i} Done. Inserted: ${batchInserted} new medicines.`);
    } else {
      console.log(`⚠️ Batch ${i} failed. Skipping...`);
    }

    if (i < TOTAL_BATCHES) {
      console.log("⏳ Waiting 5 seconds for API rate limit...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log(`\n🎉 ALL DONE! Successfully inserted ${totalInserted} new medicines into Master Database!`);
  await prisma.$disconnect();
}

startBulkGeneration();
