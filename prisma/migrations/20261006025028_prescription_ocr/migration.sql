-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'MANUAL_REVIEW');

-- CreateTable
CREATE TABLE "PrescriptionOcrJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "extractedText" TEXT,
    "extractedItems" JSONB,
    "status" "OcrStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'MANUAL',
    "confidence" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionOcrJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrescriptionOcrJob_userId_createdAt_idx" ON "PrescriptionOcrJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PrescriptionOcrJob_status_idx" ON "PrescriptionOcrJob"("status");

-- AddForeignKey
ALTER TABLE "PrescriptionOcrJob" ADD CONSTRAINT "PrescriptionOcrJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
