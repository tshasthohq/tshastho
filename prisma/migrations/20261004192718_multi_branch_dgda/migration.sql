-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DrugSchedule" AS ENUM ('OTC', 'PRESCRIPTION', 'NARCOTIC', 'CONTROLLED', 'ANTIBIOTIC');

-- CreateEnum
CREATE TYPE "RegulatoryLogType" AS ENUM ('INWARD', 'OUTWARD', 'DISPOSAL', 'TRANSFER', 'ADJUSTMENT', 'RETURN');

-- CreateTable
CREATE TABLE "PharmacyBranch" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "managerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMainBranch" BOOLEAN NOT NULL DEFAULT false,
    "openingCash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchStock" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "fromBranchId" TEXT NOT NULL,
    "toBranchId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "notes" TEXT,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "receivedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchStaff" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "BranchStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryLog" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "logNumber" TEXT NOT NULL,
    "logType" "RegulatoryLogType" NOT NULL,
    "medicineId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "drugSchedule" "DrugSchedule" NOT NULL,
    "batchNumber" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'piece',
    "supplierName" TEXT,
    "customerName" TEXT,
    "customerAddress" TEXT,
    "doctorName" TEXT,
    "prescriptionNo" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "notes" TEXT,
    "reportedById" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulatoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DGDAReport" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalEntries" INTEGER NOT NULL DEFAULT 0,
    "narcoticCount" INTEGER NOT NULL DEFAULT 0,
    "controlledCount" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" TEXT,
    "generatedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DGDAReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PharmacyBranch_pharmacyId_isActive_idx" ON "PharmacyBranch"("pharmacyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyBranch_pharmacyId_code_key" ON "PharmacyBranch"("pharmacyId", "code");

-- CreateIndex
CREATE INDEX "BranchStock_branchId_idx" ON "BranchStock"("branchId");

-- CreateIndex
CREATE INDEX "BranchStock_medicineId_idx" ON "BranchStock"("medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchStock_branchId_medicineId_key" ON "BranchStock"("branchId", "medicineId");

-- CreateIndex
CREATE INDEX "BranchTransfer_pharmacyId_status_idx" ON "BranchTransfer"("pharmacyId", "status");

-- CreateIndex
CREATE INDEX "BranchTransfer_fromBranchId_idx" ON "BranchTransfer"("fromBranchId");

-- CreateIndex
CREATE INDEX "BranchTransfer_toBranchId_idx" ON "BranchTransfer"("toBranchId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchTransfer_pharmacyId_transferNumber_key" ON "BranchTransfer"("pharmacyId", "transferNumber");

-- CreateIndex
CREATE INDEX "BranchTransferItem_transferId_idx" ON "BranchTransferItem"("transferId");

-- CreateIndex
CREATE INDEX "BranchStaff_userId_isActive_idx" ON "BranchStaff"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BranchStaff_branchId_userId_key" ON "BranchStaff"("branchId", "userId");

-- CreateIndex
CREATE INDEX "RegulatoryLog_pharmacyId_entryDate_idx" ON "RegulatoryLog"("pharmacyId", "entryDate");

-- CreateIndex
CREATE INDEX "RegulatoryLog_pharmacyId_drugSchedule_idx" ON "RegulatoryLog"("pharmacyId", "drugSchedule");

-- CreateIndex
CREATE INDEX "RegulatoryLog_medicineId_idx" ON "RegulatoryLog"("medicineId");

-- CreateIndex
CREATE INDEX "DGDAReport_pharmacyId_createdAt_idx" ON "DGDAReport"("pharmacyId", "createdAt");

-- AddForeignKey
ALTER TABLE "PharmacyBranch" ADD CONSTRAINT "PharmacyBranch_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyBranch" ADD CONSTRAINT "PharmacyBranch_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchStock" ADD CONSTRAINT "BranchStock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "PharmacyBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchStock" ADD CONSTRAINT "BranchStock_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTransfer" ADD CONSTRAINT "BranchTransfer_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTransfer" ADD CONSTRAINT "BranchTransfer_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "PharmacyBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTransfer" ADD CONSTRAINT "BranchTransfer_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "PharmacyBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTransfer" ADD CONSTRAINT "BranchTransfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTransfer" ADD CONSTRAINT "BranchTransfer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTransfer" ADD CONSTRAINT "BranchTransfer_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTransferItem" ADD CONSTRAINT "BranchTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "BranchTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTransferItem" ADD CONSTRAINT "BranchTransferItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchStaff" ADD CONSTRAINT "BranchStaff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "PharmacyBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchStaff" ADD CONSTRAINT "BranchStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryLog" ADD CONSTRAINT "RegulatoryLog_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryLog" ADD CONSTRAINT "RegulatoryLog_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryLog" ADD CONSTRAINT "RegulatoryLog_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DGDAReport" ADD CONSTRAINT "DGDAReport_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DGDAReport" ADD CONSTRAINT "DGDAReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
