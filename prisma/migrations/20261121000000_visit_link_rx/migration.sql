-- AlterTable
ALTER TABLE "DoctorVisit" ADD COLUMN     "chamberId" TEXT,
ADD COLUMN     "localPrescriptionId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'MANUAL';

-- CreateIndex
CREATE UNIQUE INDEX "DoctorVisit_localPrescriptionId_key" ON "DoctorVisit"("localPrescriptionId");

-- CreateIndex
CREATE INDEX "DoctorVisit_chamberId_idx" ON "DoctorVisit"("chamberId");

