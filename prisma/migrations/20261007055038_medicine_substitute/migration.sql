-- CreateTable
CREATE TABLE "MedicineSubstitute" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT,
    "originalName" TEXT NOT NULL,
    "originalGeneric" TEXT,
    "substituteName" TEXT NOT NULL,
    "substituteGeneric" TEXT,
    "reason" TEXT,
    "priceDifference" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineSubstitute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicineSubstitute_pharmacyId_originalName_idx" ON "MedicineSubstitute"("pharmacyId", "originalName");

-- CreateIndex
CREATE INDEX "MedicineSubstitute_originalName_idx" ON "MedicineSubstitute"("originalName");

-- CreateIndex
CREATE INDEX "MedicineSubstitute_substituteName_idx" ON "MedicineSubstitute"("substituteName");

-- CreateIndex
CREATE INDEX "MedicineSubstitute_isGlobal_isActive_idx" ON "MedicineSubstitute"("isGlobal", "isActive");

-- AddForeignKey
ALTER TABLE "MedicineSubstitute" ADD CONSTRAINT "MedicineSubstitute_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
