-- CreateTable
CREATE TABLE "print_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "pharmacyId" TEXT,
    "userId" TEXT,
    "connectionType" TEXT NOT NULL DEFAULT 'browser',
    "paperWidth" INTEGER NOT NULL DEFAULT 58,
    "deviceName" TEXT,
    "bytesSent" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "receiptData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "print_logs_orderId_idx" ON "print_logs"("orderId");

-- CreateIndex
CREATE INDEX "print_logs_pharmacyId_createdAt_idx" ON "print_logs"("pharmacyId", "createdAt");

-- CreateIndex
CREATE INDEX "print_logs_userId_createdAt_idx" ON "print_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "print_logs" ADD CONSTRAINT "print_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_logs" ADD CONSTRAINT "print_logs_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_logs" ADD CONSTRAINT "print_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
