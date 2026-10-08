-- CreateTable
CREATE TABLE "cash_drawer_logs" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftId" TEXT,
    "reason" TEXT NOT NULL DEFAULT 'MANUAL',
    "amount" DECIMAL(65,30) DEFAULT 0,
    "posSaleId" TEXT,
    "notes" TEXT,
    "deviceName" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_drawer_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_drawer_logs_pharmacyId_createdAt_idx" ON "cash_drawer_logs"("pharmacyId", "createdAt");

-- CreateIndex
CREATE INDEX "cash_drawer_logs_userId_createdAt_idx" ON "cash_drawer_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "cash_drawer_logs" ADD CONSTRAINT "cash_drawer_logs_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_drawer_logs" ADD CONSTRAINT "cash_drawer_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
