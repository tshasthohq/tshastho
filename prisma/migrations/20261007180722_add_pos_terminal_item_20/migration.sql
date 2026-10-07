-- CreateTable
CREATE TABLE "pos_terminals" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "os" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "pos_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminals_deviceId_key" ON "pos_terminals"("deviceId");

-- CreateIndex
CREATE INDEX "pos_terminals_pharmacyId_isActive_idx" ON "pos_terminals"("pharmacyId", "isActive");

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
