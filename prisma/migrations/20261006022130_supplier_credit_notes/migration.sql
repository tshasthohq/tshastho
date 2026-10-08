-- CreateEnum
CREATE TYPE "SupplierCreditStatus" AS ENUM ('ISSUED', 'PARTIALLY_APPLIED', 'APPLIED', 'VOIDED');

-- CreateTable
CREATE TABLE "SupplierCreditNote" (
    "id" TEXT NOT NULL,
    "creditNumber" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "returnOrderId" TEXT,
    "originalPurchaseId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "appliedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "SupplierCreditStatus" NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,
    "issuedById" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),
    "voidedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierCreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierCreditNote_creditNumber_key" ON "SupplierCreditNote"("creditNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierCreditNote_returnOrderId_key" ON "SupplierCreditNote"("returnOrderId");

-- CreateIndex
CREATE INDEX "SupplierCreditNote_pharmacyId_supplierId_idx" ON "SupplierCreditNote"("pharmacyId", "supplierId");

-- CreateIndex
CREATE INDEX "SupplierCreditNote_pharmacyId_status_idx" ON "SupplierCreditNote"("pharmacyId", "status");

-- CreateIndex
CREATE INDEX "SupplierCreditNote_supplierId_status_idx" ON "SupplierCreditNote"("supplierId", "status");

-- AddForeignKey
ALTER TABLE "SupplierCreditNote" ADD CONSTRAINT "SupplierCreditNote_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCreditNote" ADD CONSTRAINT "SupplierCreditNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCreditNote" ADD CONSTRAINT "SupplierCreditNote_returnOrderId_fkey" FOREIGN KEY ("returnOrderId") REFERENCES "ReturnOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCreditNote" ADD CONSTRAINT "SupplierCreditNote_originalPurchaseId_fkey" FOREIGN KEY ("originalPurchaseId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCreditNote" ADD CONSTRAINT "SupplierCreditNote_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
