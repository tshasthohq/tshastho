-- AlterTable
ALTER TABLE "DiagnosticOrderItem" ADD COLUMN     "reportHash" TEXT,
ADD COLUMN     "reportVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DiagnosticReportVersion" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticReportVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiagnosticReportVersion_itemId_idx" ON "DiagnosticReportVersion"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticReportVersion_itemId_version_key" ON "DiagnosticReportVersion"("itemId", "version");

-- AddForeignKey
ALTER TABLE "DiagnosticReportVersion" ADD CONSTRAINT "DiagnosticReportVersion_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "DiagnosticOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

