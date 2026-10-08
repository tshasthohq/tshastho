-- CreateTable
CREATE TABLE "PharmacyAuditLog" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PharmacyAuditLog_pharmacyId_createdAt_idx" ON "PharmacyAuditLog"("pharmacyId", "createdAt");

-- CreateIndex
CREATE INDEX "PharmacyAuditLog_pharmacyId_action_idx" ON "PharmacyAuditLog"("pharmacyId", "action");

-- CreateIndex
CREATE INDEX "PharmacyAuditLog_userId_createdAt_idx" ON "PharmacyAuditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PharmacyAuditLog" ADD CONSTRAINT "PharmacyAuditLog_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyAuditLog" ADD CONSTRAINT "PharmacyAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
