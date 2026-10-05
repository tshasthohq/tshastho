-- CreateEnum
CREATE TYPE "RxPharmacyRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CONVERTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "RxPharmacyRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "localPrescriptionId" TEXT,
    "patientId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "status" "RxPharmacyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "respondedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "medicineId" TEXT,

    CONSTRAINT "RxPharmacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RxPharmacyRequest_requestNumber_key" ON "RxPharmacyRequest"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RxPharmacyRequest_orderId_key" ON "RxPharmacyRequest"("orderId");

-- CreateIndex
CREATE INDEX "RxPharmacyRequest_pharmacyId_status_idx" ON "RxPharmacyRequest"("pharmacyId", "status");

-- CreateIndex
CREATE INDEX "RxPharmacyRequest_patientId_status_idx" ON "RxPharmacyRequest"("patientId", "status");

-- CreateIndex
CREATE INDEX "RxPharmacyRequest_prescriptionId_idx" ON "RxPharmacyRequest"("prescriptionId");

-- AddForeignKey
ALTER TABLE "RxPharmacyRequest" ADD CONSTRAINT "RxPharmacyRequest_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxPharmacyRequest" ADD CONSTRAINT "RxPharmacyRequest_localPrescriptionId_fkey" FOREIGN KEY ("localPrescriptionId") REFERENCES "LocalPrescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxPharmacyRequest" ADD CONSTRAINT "RxPharmacyRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxPharmacyRequest" ADD CONSTRAINT "RxPharmacyRequest_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxPharmacyRequest" ADD CONSTRAINT "RxPharmacyRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxPharmacyRequest" ADD CONSTRAINT "RxPharmacyRequest_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxPharmacyRequest" ADD CONSTRAINT "RxPharmacyRequest_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
