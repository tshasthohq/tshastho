-- CreateEnum
CREATE TYPE "ExpiryWriteOffStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "NarcoticRegister" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "batchNumber" TEXT,
    "direction" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "patientName" TEXT,
    "patientAddress" TEXT,
    "doctorName" TEXT,
    "doctorRegNo" TEXT,
    "prescriptionNo" TEXT,
    "supplierName" TEXT,
    "notes" TEXT,
    "recordedById" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NarcoticRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpiryWriteOffBatch" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'EXPIRED',
    "status" "ExpiryWriteOffStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpiryWriteOffBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NarcoticRegister_pharmacyId_entryDate_idx" ON "NarcoticRegister"("pharmacyId", "entryDate");

-- CreateIndex
CREATE INDEX "NarcoticRegister_medicineId_idx" ON "NarcoticRegister"("medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "NarcoticRegister_pharmacyId_entryNumber_key" ON "NarcoticRegister"("pharmacyId", "entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ExpiryWriteOffBatch_batchId_key" ON "ExpiryWriteOffBatch"("batchId");

-- CreateIndex
CREATE INDEX "ExpiryWriteOffBatch_pharmacyId_status_idx" ON "ExpiryWriteOffBatch"("pharmacyId", "status");

-- CreateIndex
CREATE INDEX "ExpiryWriteOffBatch_pharmacyId_createdAt_idx" ON "ExpiryWriteOffBatch"("pharmacyId", "createdAt");

-- AddForeignKey
ALTER TABLE "NarcoticRegister" ADD CONSTRAINT "NarcoticRegister_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarcoticRegister" ADD CONSTRAINT "NarcoticRegister_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarcoticRegister" ADD CONSTRAINT "NarcoticRegister_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpiryWriteOffBatch" ADD CONSTRAINT "ExpiryWriteOffBatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpiryWriteOffBatch" ADD CONSTRAINT "ExpiryWriteOffBatch_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpiryWriteOffBatch" ADD CONSTRAINT "ExpiryWriteOffBatch_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpiryWriteOffBatch" ADD CONSTRAINT "ExpiryWriteOffBatch_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
