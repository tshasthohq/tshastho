-- AlterTable
ALTER TABLE "DiagnosticOrder" ADD COLUMN     "agentId" TEXT;

-- AlterTable
ALTER TABLE "DiagnosticReferrer" ADD COLUMN     "commissionMode" TEXT NOT NULL DEFAULT 'TEST_DEFAULT',
ADD COLUMN     "commissionValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "specialty" TEXT;

-- CreateTable
CREATE TABLE "DiagnosticCommission" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "base" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticAuditLog" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityLabel" TEXT,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "reason" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiagnosticCommission_diagnosticId_status_idx" ON "DiagnosticCommission"("diagnosticId", "status");

-- CreateIndex
CREATE INDEX "DiagnosticCommission_orderId_idx" ON "DiagnosticCommission"("orderId");

-- CreateIndex
CREATE INDEX "DiagnosticCommission_referrerId_status_idx" ON "DiagnosticCommission"("referrerId", "status");

-- CreateIndex
CREATE INDEX "DiagnosticAuditLog_diagnosticId_entity_entityId_idx" ON "DiagnosticAuditLog"("diagnosticId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "DiagnosticAuditLog_diagnosticId_createdAt_idx" ON "DiagnosticAuditLog"("diagnosticId", "createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticOrder_agentId_idx" ON "DiagnosticOrder"("agentId");

-- AddForeignKey
ALTER TABLE "DiagnosticOrder" ADD CONSTRAINT "DiagnosticOrder_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "DiagnosticReferrer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticCommission" ADD CONSTRAINT "DiagnosticCommission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DiagnosticOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticCommission" ADD CONSTRAINT "DiagnosticCommission_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "DiagnosticReferrer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

