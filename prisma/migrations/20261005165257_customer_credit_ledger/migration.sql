-- CreateEnum
CREATE TYPE "CreditEntryType" AS ENUM ('SALE_ON_CREDIT', 'PAYMENT_RECEIVED', 'ADJUSTMENT', 'WRITE_OFF');

-- CreateTable
CREATE TABLE "CustomerCreditLedger" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CreditEntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "description" TEXT,
    "paymentMethod" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicineId" TEXT,

    CONSTRAINT "CustomerCreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerCreditLedger_pharmacyId_customerId_idx" ON "CustomerCreditLedger"("pharmacyId", "customerId");

-- CreateIndex
CREATE INDEX "CustomerCreditLedger_pharmacyId_createdAt_idx" ON "CustomerCreditLedger"("pharmacyId", "createdAt");

-- AddForeignKey
ALTER TABLE "CustomerCreditLedger" ADD CONSTRAINT "CustomerCreditLedger_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditLedger" ADD CONSTRAINT "CustomerCreditLedger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditLedger" ADD CONSTRAINT "CustomerCreditLedger_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
