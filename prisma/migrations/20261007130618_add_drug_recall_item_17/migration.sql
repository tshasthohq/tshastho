-- CreateTable
CREATE TABLE "drug_recalls" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "drugName" TEXT NOT NULL,
    "genericName" TEXT,
    "batchNumbers" TEXT[],
    "manufacturer" TEXT,
    "reason" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "recallDate" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "rawPayload" JSONB,
    "aiExtracted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drug_recalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recall_matches" (
    "id" TEXT NOT NULL,
    "recallId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "batchId" TEXT,
    "medicineId" TEXT,
    "matchType" TEXT NOT NULL DEFAULT 'BATCH',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recall_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drug_recalls_externalId_key" ON "drug_recalls"("externalId");

-- CreateIndex
CREATE INDEX "drug_recalls_source_recallDate_idx" ON "drug_recalls"("source", "recallDate");

-- CreateIndex
CREATE INDEX "drug_recalls_severity_idx" ON "drug_recalls"("severity");

-- CreateIndex
CREATE INDEX "recall_matches_pharmacyId_status_idx" ON "recall_matches"("pharmacyId", "status");

-- CreateIndex
CREATE INDEX "recall_matches_recallId_idx" ON "recall_matches"("recallId");

-- CreateIndex
CREATE UNIQUE INDEX "recall_matches_recallId_pharmacyId_batchId_key" ON "recall_matches"("recallId", "pharmacyId", "batchId");

-- AddForeignKey
ALTER TABLE "recall_matches" ADD CONSTRAINT "recall_matches_recallId_fkey" FOREIGN KEY ("recallId") REFERENCES "drug_recalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recall_matches" ADD CONSTRAINT "recall_matches_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recall_matches" ADD CONSTRAINT "recall_matches_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
