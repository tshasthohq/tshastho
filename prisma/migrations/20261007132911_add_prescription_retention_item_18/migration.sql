-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "anonymizedAt" TIMESTAMP(3),
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "legalHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "purgeAfter" TIMESTAMP(3),
ADD COLUMN     "retentionPolicy" TEXT NOT NULL DEFAULT 'DGDA_5Y',
ADD COLUMN     "retentionUntil" TIMESTAMP(3);
