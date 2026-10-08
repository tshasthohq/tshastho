/*
  Warnings:

  - A unique constraint covering the columns `[signatureUrl]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Doctor_licenseNumber_key";

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "signatureUrl" TEXT;

-- CreateTable
CREATE TABLE "PrescriptionTemplate" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chiefComplaint" TEXT,
    "examination" TEXT,
    "diagnosis" TEXT,
    "investigations" TEXT,
    "advice" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "strength" TEXT,
    "dosage" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "quantity" TEXT,
    "beforeAfterMeal" TEXT,
    "instructions" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrescriptionTemplate_doctorId_createdAt_idx" ON "PrescriptionTemplate"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "PrescriptionTemplateItem_templateId_idx" ON "PrescriptionTemplateItem"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_signatureUrl_key" ON "Doctor"("signatureUrl");

-- AddForeignKey
ALTER TABLE "PrescriptionTemplate" ADD CONSTRAINT "PrescriptionTemplate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateItem" ADD CONSTRAINT "PrescriptionTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PrescriptionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
