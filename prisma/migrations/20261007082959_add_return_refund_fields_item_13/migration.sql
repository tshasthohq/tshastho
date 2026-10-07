-- AlterTable
ALTER TABLE "ReturnOrder" ADD COLUMN     "refundAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "refundError" TEXT,
ADD COLUMN     "refundStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "refundTxnId" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
