-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BKASH', 'NAGAD', 'ROCKET', 'SSLCOMMERZ', 'STRIPE', 'CASH', 'COD', 'MANUAL');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('CUSTOMER', 'PLATFORM', 'PARTNER', 'GATEWAY', 'COMMISSION');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'SETTLED', 'FAILED', 'ON_HOLD');

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "method" "PaymentMethod" NOT NULL,
    "gatewayProvider" TEXT,
    "gatewayTxnId" TEXT,
    "gatewayRefId" TEXT,
    "gatewayPayload" JSONB,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "account" "LedgerAccount" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "debitAccount" "LedgerAccount" NOT NULL,
    "creditAccount" "LedgerAccount" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "description" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "gatewayRefId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "partnerId" TEXT,
    "partnerType" TEXT,
    "orderAmount" DECIMAL(65,30) NOT NULL,
    "commissionRate" DECIMAL(65,30) NOT NULL,
    "commissionAmount" DECIMAL(65,30) NOT NULL,
    "partnerShare" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "payoutNumber" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "accountInfo" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "settlementNumber" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossAmount" DECIMAL(65,30) NOT NULL,
    "commissionAmount" DECIMAL(65,30) NOT NULL,
    "netPayable" DECIMAL(65,30) NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "payoutId" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_gatewayTxnId_idx" ON "Payment"("gatewayTxnId");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_paymentId_idx" ON "Transaction"("paymentId");

-- CreateIndex
CREATE INDEX "Transaction_account_createdAt_idx" ON "Transaction"("account", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_debitAccount_createdAt_idx" ON "LedgerEntry"("debitAccount", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_creditAccount_createdAt_idx" ON "LedgerEntry"("creditAccount", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundNumber_key" ON "Refund"("refundNumber");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_orderId_key" ON "Commission"("orderId");

-- CreateIndex
CREATE INDEX "Commission_partnerId_idx" ON "Commission"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_payoutNumber_key" ON "Payout"("payoutNumber");

-- CreateIndex
CREATE INDEX "Payout_partnerId_status_idx" ON "Payout"("partnerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_settlementNumber_key" ON "Settlement"("settlementNumber");

-- CreateIndex
CREATE INDEX "Settlement_partnerId_status_idx" ON "Settlement"("partnerId", "status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
