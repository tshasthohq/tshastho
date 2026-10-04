-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'SALARY', 'UTILITY', 'TRANSPORT', 'PURCHASE', 'MAINTENANCE', 'MARKETING', 'TAX', 'MISC');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('SALE', 'POS_SALE', 'PURCHASE', 'EXPENSE', 'PAYMENT_RECEIVED', 'REFUND', 'SETTLEMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "DailyClosingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "SettlementRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "PharmacyExpense" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyLedger" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "entryType" "LedgerEntryType" NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyClosing" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "status" "DailyClosingStatus" NOT NULL DEFAULT 'DRAFT',
    "openingCash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "closingCash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expectedCash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "difference" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalSales" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPosSales" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPurchases" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalCashIn" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalCashOut" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netCashFlow" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "posSaleCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "closedById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "status" "SettlementRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossSales" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "commissionAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "refundAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netPayable" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "payoutId" TEXT,
    "bankAccount" JSONB,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PharmacyExpense_pharmacyId_expenseDate_idx" ON "PharmacyExpense"("pharmacyId", "expenseDate");

-- CreateIndex
CREATE INDEX "PharmacyExpense_pharmacyId_status_idx" ON "PharmacyExpense"("pharmacyId", "status");

-- CreateIndex
CREATE INDEX "PharmacyExpense_pharmacyId_category_idx" ON "PharmacyExpense"("pharmacyId", "category");

-- CreateIndex
CREATE INDEX "PharmacyLedger_pharmacyId_createdAt_idx" ON "PharmacyLedger"("pharmacyId", "createdAt");

-- CreateIndex
CREATE INDEX "PharmacyLedger_pharmacyId_entryType_idx" ON "PharmacyLedger"("pharmacyId", "entryType");

-- CreateIndex
CREATE INDEX "PharmacyLedger_referenceId_idx" ON "PharmacyLedger"("referenceId");

-- CreateIndex
CREATE INDEX "DailyClosing_pharmacyId_closingDate_idx" ON "DailyClosing"("pharmacyId", "closingDate");

-- CreateIndex
CREATE INDEX "DailyClosing_pharmacyId_status_idx" ON "DailyClosing"("pharmacyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyClosing_pharmacyId_closingDate_key" ON "DailyClosing"("pharmacyId", "closingDate");

-- CreateIndex
CREATE INDEX "SettlementRequest_pharmacyId_status_idx" ON "SettlementRequest"("pharmacyId", "status");

-- CreateIndex
CREATE INDEX "SettlementRequest_status_createdAt_idx" ON "SettlementRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementRequest_pharmacyId_requestNumber_key" ON "SettlementRequest"("pharmacyId", "requestNumber");

-- AddForeignKey
ALTER TABLE "PharmacyExpense" ADD CONSTRAINT "PharmacyExpense_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyExpense" ADD CONSTRAINT "PharmacyExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyExpense" ADD CONSTRAINT "PharmacyExpense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyLedger" ADD CONSTRAINT "PharmacyLedger_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyLedger" ADD CONSTRAINT "PharmacyLedger_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyClosing" ADD CONSTRAINT "DailyClosing_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyClosing" ADD CONSTRAINT "DailyClosing_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyClosing" ADD CONSTRAINT "DailyClosing_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRequest" ADD CONSTRAINT "SettlementRequest_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRequest" ADD CONSTRAINT "SettlementRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRequest" ADD CONSTRAINT "SettlementRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
