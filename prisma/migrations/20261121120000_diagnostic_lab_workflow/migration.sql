-- AlterTable
ALTER TABLE "DiagnosticOrderItem" ADD COLUMN     "interpretation" TEXT,
ADD COLUMN     "resultEnteredAt" TIMESTAMP(3),
ADD COLUMN     "resultEnteredBy" TEXT,
ADD COLUMN     "results" JSONB,
ADD COLUMN     "sampleCollectedAt" TIMESTAMP(3),
ADD COLUMN     "sampleCollectedBy" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- CreateIndex
CREATE INDEX "DiagnosticOrderItem_status_idx" ON "DiagnosticOrderItem"("status");

