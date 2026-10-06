-- CreateEnum
CREATE TYPE "VatReportStatus" AS ENUM ('DRAFT', 'FINALIZED', 'SUBMITTED', 'REVISED');

-- CreateTable
CREATE TABLE "TaxConfiguration" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "isVatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "vatNumber" TEXT,
    "tinNumber" TEXT,
    "businessName" TEXT,
    "businessAddress" TEXT,
    "vatRate" DECIMAL(65,30) NOT NULL DEFAULT 15,
    "enableVatOnPos" BOOLEAN NOT NULL DEFAULT false,
    "enableVatOnOnline" BOOLEAN NOT NULL DEFAULT false,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VatInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "orderId" TEXT,
    "posSaleId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerVatNumber" TEXT,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VatInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VatReport" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalSales" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalVat" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalInvoices" INTEGER NOT NULL DEFAULT 0,
    "cancelledCount" INTEGER NOT NULL DEFAULT 0,
    "vatNumber" TEXT,
    "status" "VatReportStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VatReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxConfiguration_pharmacyId_key" ON "TaxConfiguration"("pharmacyId");

-- CreateIndex
CREATE UNIQUE INDEX "VatInvoice_invoiceNumber_key" ON "VatInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VatInvoice_orderId_key" ON "VatInvoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "VatInvoice_posSaleId_key" ON "VatInvoice"("posSaleId");

-- CreateIndex
CREATE INDEX "VatInvoice_pharmacyId_invoiceDate_idx" ON "VatInvoice"("pharmacyId", "invoiceDate");

-- CreateIndex
CREATE INDEX "VatInvoice_pharmacyId_isCancelled_idx" ON "VatInvoice"("pharmacyId", "isCancelled");

-- CreateIndex
CREATE UNIQUE INDEX "VatReport_reportNumber_key" ON "VatReport"("reportNumber");

-- CreateIndex
CREATE INDEX "VatReport_pharmacyId_createdAt_idx" ON "VatReport"("pharmacyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VatReport_pharmacyId_month_key" ON "VatReport"("pharmacyId", "month");

-- AddForeignKey
ALTER TABLE "TaxConfiguration" ADD CONSTRAINT "TaxConfiguration_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatInvoice" ADD CONSTRAINT "VatInvoice_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatInvoice" ADD CONSTRAINT "VatInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatInvoice" ADD CONSTRAINT "VatInvoice_posSaleId_fkey" FOREIGN KEY ("posSaleId") REFERENCES "PosSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatReport" ADD CONSTRAINT "VatReport_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatReport" ADD CONSTRAINT "VatReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
