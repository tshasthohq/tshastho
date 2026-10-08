-- CreateTable
CREATE TABLE "sample_batches" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "remaining" INTEGER NOT NULL DEFAULT 0,
    "supplierId" TEXT,
    "repName" TEXT,
    "repPhone" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedBy" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_distributions" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "sampleBatchId" TEXT NOT NULL,
    "doctorId" TEXT,
    "doctorName" TEXT NOT NULL,
    "doctorPhone" TEXT,
    "doctorClinic" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "givenBy" TEXT,
    "feedback" TEXT,
    "feedbackAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sample_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sample_batches_pharmacyId_isActive_idx" ON "sample_batches"("pharmacyId", "isActive");

-- CreateIndex
CREATE INDEX "sample_batches_medicineId_idx" ON "sample_batches"("medicineId");

-- CreateIndex
CREATE INDEX "sample_batches_expiryDate_idx" ON "sample_batches"("expiryDate");

-- CreateIndex
CREATE INDEX "sample_distributions_pharmacyId_givenAt_idx" ON "sample_distributions"("pharmacyId", "givenAt");

-- CreateIndex
CREATE INDEX "sample_distributions_sampleBatchId_idx" ON "sample_distributions"("sampleBatchId");

-- CreateIndex
CREATE INDEX "sample_distributions_doctorId_idx" ON "sample_distributions"("doctorId");

-- AddForeignKey
ALTER TABLE "sample_batches" ADD CONSTRAINT "sample_batches_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_batches" ADD CONSTRAINT "sample_batches_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_batches" ADD CONSTRAINT "sample_batches_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_batches" ADD CONSTRAINT "sample_batches_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_distributions" ADD CONSTRAINT "sample_distributions_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_distributions" ADD CONSTRAINT "sample_distributions_sampleBatchId_fkey" FOREIGN KEY ("sampleBatchId") REFERENCES "sample_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_distributions" ADD CONSTRAINT "sample_distributions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_distributions" ADD CONSTRAINT "sample_distributions_givenBy_fkey" FOREIGN KEY ("givenBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
