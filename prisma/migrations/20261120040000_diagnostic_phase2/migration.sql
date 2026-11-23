-- CreateEnum
CREATE TYPE "DiagnosticOrderStatus" AS ENUM ('REGISTERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiagnosticPayStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DiagnosticPayMethod" AS ENUM ('CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "DiagnosticReferrerType" AS ENUM ('DOCTOR', 'AGENT', 'PC');

-- CreateEnum
CREATE TYPE "DiagnosticItemStatus" AS ENUM ('PENDING', 'SAMPLE_COLLECTED', 'RESULT_ENTERED', 'VERIFIED', 'APPROVED');

-- CreateTable
CREATE TABLE "DiagnosticPatient" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "patientNo" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "age" INTEGER,
    "ageUnit" TEXT NOT NULL DEFAULT 'Y',
    "gender" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticPatient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticReferrer" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "type" "DiagnosticReferrerType" NOT NULL DEFAULT 'DOCTOR',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "degree" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticReferrer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticOrder" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "branchId" TEXT,
    "orderNo" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "referrerId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WALKIN',
    "status" "DiagnosticOrderStatus" NOT NULL DEFAULT 'REGISTERED',
    "payStatus" "DiagnosticPayStatus" NOT NULL DEFAULT 'UNPAID',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "due" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "testCode" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "commissionType" TEXT NOT NULL DEFAULT 'PERCENT',
    "commissionValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "DiagnosticItemStatus" NOT NULL DEFAULT 'PENDING',
    "promisedAt" TIMESTAMP(3),

    CONSTRAINT "DiagnosticOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticOrderPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" "DiagnosticPayMethod" NOT NULL DEFAULT 'CASH',
    "isRefund" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT,
    "note" TEXT,
    "receivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticOrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticCounter" (
    "diagnosticId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DiagnosticCounter_pkey" PRIMARY KEY ("diagnosticId","key")
);

-- CreateIndex
CREATE INDEX "DiagnosticPatient_diagnosticId_phone_idx" ON "DiagnosticPatient"("diagnosticId", "phone");

-- CreateIndex
CREATE INDEX "DiagnosticPatient_diagnosticId_name_idx" ON "DiagnosticPatient"("diagnosticId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticPatient_diagnosticId_patientNo_key" ON "DiagnosticPatient"("diagnosticId", "patientNo");

-- CreateIndex
CREATE INDEX "DiagnosticReferrer_diagnosticId_type_idx" ON "DiagnosticReferrer"("diagnosticId", "type");

-- CreateIndex
CREATE INDEX "DiagnosticOrder_diagnosticId_createdAt_idx" ON "DiagnosticOrder"("diagnosticId", "createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticOrder_diagnosticId_status_idx" ON "DiagnosticOrder"("diagnosticId", "status");

-- CreateIndex
CREATE INDEX "DiagnosticOrder_patientId_idx" ON "DiagnosticOrder"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticOrder_diagnosticId_orderNo_key" ON "DiagnosticOrder"("diagnosticId", "orderNo");

-- CreateIndex
CREATE INDEX "DiagnosticOrderItem_orderId_idx" ON "DiagnosticOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "DiagnosticOrderItem_testId_idx" ON "DiagnosticOrderItem"("testId");

-- CreateIndex
CREATE INDEX "DiagnosticOrderPayment_orderId_idx" ON "DiagnosticOrderPayment"("orderId");

-- AddForeignKey
ALTER TABLE "DiagnosticPatient" ADD CONSTRAINT "DiagnosticPatient_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticReferrer" ADD CONSTRAINT "DiagnosticReferrer_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOrder" ADD CONSTRAINT "DiagnosticOrder_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOrder" ADD CONSTRAINT "DiagnosticOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "DiagnosticBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOrder" ADD CONSTRAINT "DiagnosticOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "DiagnosticPatient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOrder" ADD CONSTRAINT "DiagnosticOrder_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "DiagnosticReferrer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOrderItem" ADD CONSTRAINT "DiagnosticOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DiagnosticOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOrderItem" ADD CONSTRAINT "DiagnosticOrderItem_testId_fkey" FOREIGN KEY ("testId") REFERENCES "DiagnosticTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOrderPayment" ADD CONSTRAINT "DiagnosticOrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DiagnosticOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
