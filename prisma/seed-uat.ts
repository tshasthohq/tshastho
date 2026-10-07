// UAT test data seeder — Item 25
// Minimal seeder: creates test owner + staff + patient + pharmacy.
// Uses `prisma as any` to bypass strict enum typing.
// Run: npx tsx prisma/seed-uat.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

const UAT = {
  pharmacyId: 'uat-pharmacy-001',
  ownerId: 'uat-owner-001',
  staffId: 'uat-staff-001',
  patientId: 'uat-patient-001',
};

async function safe(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log('  ✅', label);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log('  ⚠️ ', label, '—', msg.slice(0, 100));
  }
}

async function main() {
  console.log('🌱 Seeding UAT data...');

  await safe('Owner user', () =>
    p.user.upsert({
      where: { id: UAT.ownerId },
      update: {},
      create: {
        id: UAT.ownerId,
        email: 'uat-owner@tshastho.test',
        phone: '01700000001',
        password: 'hashed_placeholder',
        role: 'PHARMACY_OWNER',
        status: 'ACTIVE',
      },
    }),
  );

  await safe('Staff user', () =>
    p.user.upsert({
      where: { id: UAT.staffId },
      update: {},
      create: {
        id: UAT.staffId,
        email: 'uat-staff@tshastho.test',
        phone: '01700000002',
        password: 'hashed_placeholder',
        role: 'PHARMACY_STAFF',
        status: 'ACTIVE',
        parentPharmacyId: UAT.pharmacyId,
        commissionPercent: 5,
      },
    }),
  );

  await safe('Patient user', () =>
    p.user.upsert({
      where: { id: UAT.patientId },
      update: {},
      create: {
        id: UAT.patientId,
        email: 'uat-patient@tshastho.test',
        phone: '01700000003',
        password: 'hashed_placeholder',
        role: 'PATIENT',
        status: 'ACTIVE',
      },
    }),
  );

  await safe('Pharmacy', () =>
    p.pharmacy.upsert({
      where: { id: UAT.pharmacyId },
      update: {},
      create: {
        id: UAT.pharmacyId,
        userId: UAT.ownerId,
        name: 'UAT Test Pharmacy',
        address: 'Test Address, Dhaka',
        phone: '01700000001',
      },
    }),
  );

  console.log('');
  console.log('✅ UAT seed attempt complete');
  console.log('   Owner:  ', UAT.ownerId);
  console.log('   Staff:  ', UAT.staffId);
  console.log('   Patient:', UAT.patientId);
  console.log('   Pharmacy:', UAT.pharmacyId);
  console.log('');
  console.log('⚠️  Warnings above (if any) mean field/enum mismatch — check schema.prisma.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
