import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const prisma = new PrismaClient();
const results: any[] = [];

const csvFilePath = path.join(process.cwd(), 'medicine_table_all.csv');

if (!fs.existsSync(csvFilePath)) {
  console.error('❌ Error: medicine_table_all.csv root directory-তে পাওয়া যায়নি!');
  process.exit(1);
}

console.log('⏳ CSV ফাইল পড়া শুরু হচ্ছে...');

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => {
    const cleanStr = (val: string) => val ? val.replace(/[\u2018\u2019]/g, "'").trim() : null;

    results.push({
      name: cleanStr(data.name) || 'Unknown',
      brand: cleanStr(data.brand),
      genericName: cleanStr(data.genericName),
      strength: cleanStr(data.strength),
      category: cleanStr(data.category),
      manufacturer: cleanStr(data.manufacturer),
      sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : 0,
    });
  })
  .on('end', async () => {
    console.log(`✅ মোট ${results.length} টি মেডিসিন পাওয়া গেছে।`);
    console.log('⏳ ডেটাবেসে ডেটা পুশ করা হচ্ছে (Batch আকারে)...');

    const CHUNK_SIZE = 500;
    for (let i = 0; i < results.length; i += CHUNK_SIZE) {
      const chunk = results.slice(i, i + CHUNK_SIZE);
      
      await prisma.masterMedicine.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      console.log(`👉 ${i + chunk.length} / ${results.length} ডেটা ইনসার্ট সম্পন্ন...`);
    }

    console.log('🎉 সব ডেটা সফলভাবে MasterMedicine-এ ইম্পোর্ট হয়েছে!');
    await prisma.$disconnect();
  });
