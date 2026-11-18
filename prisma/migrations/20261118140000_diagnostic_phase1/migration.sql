-- CreateEnum
CREATE TYPE "DiagnosticStaffRole" AS ENUM ('MANAGER', 'RECEPTIONIST', 'TECHNICIAN', 'PATHOLOGIST', 'RADIOLOGIST', 'ACCOUNTANT', 'SAMPLE_COLLECTOR');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DIAGNOSTIC_STAFF';

-- CreateTable
CREATE TABLE "Diagnostic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "logo" TEXT,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "city" TEXT NOT NULL,
    "tradeLicense" TEXT,
    "dghsLicense" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT,
    "closeTime" TEXT,
    "homeCollection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticBranch" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticStaff" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "role" "DiagnosticStaffRole" NOT NULL,
    "permissions" JSONB,
    "salary" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticDepartment" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DiagnosticDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticTest" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "departmentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "sampleType" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "costPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reportingHours" INTEGER NOT NULL DEFAULT 24,
    "fastingRequired" BOOLEAN NOT NULL DEFAULT false,
    "instructions" TEXT,
    "resultTemplate" JSONB,
    "referenceRanges" JSONB,
    "commissionType" TEXT NOT NULL DEFAULT 'PERCENT',
    "commissionValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "homeCollection" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticPackage" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticPackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,

    CONSTRAINT "DiagnosticPackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diagnostic_userId_key" ON "Diagnostic"("userId");

-- CreateIndex
CREATE INDEX "DiagnosticBranch_diagnosticId_idx" ON "DiagnosticBranch"("diagnosticId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticBranch_diagnosticId_code_key" ON "DiagnosticBranch"("diagnosticId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticStaff_userId_key" ON "DiagnosticStaff"("userId");

-- CreateIndex
CREATE INDEX "DiagnosticStaff_diagnosticId_idx" ON "DiagnosticStaff"("diagnosticId");

-- CreateIndex
CREATE INDEX "DiagnosticStaff_branchId_idx" ON "DiagnosticStaff"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticDepartment_diagnosticId_name_key" ON "DiagnosticDepartment"("diagnosticId", "name");

-- CreateIndex
CREATE INDEX "DiagnosticTest_diagnosticId_isActive_idx" ON "DiagnosticTest"("diagnosticId", "isActive");

-- CreateIndex
CREATE INDEX "DiagnosticTest_name_idx" ON "DiagnosticTest"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticTest_diagnosticId_code_key" ON "DiagnosticTest"("diagnosticId", "code");

-- CreateIndex
CREATE INDEX "DiagnosticPackage_diagnosticId_idx" ON "DiagnosticPackage"("diagnosticId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticPackageItem_packageId_testId_key" ON "DiagnosticPackageItem"("packageId", "testId");

-- AddForeignKey
ALTER TABLE "Diagnostic" ADD CONSTRAINT "Diagnostic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticBranch" ADD CONSTRAINT "DiagnosticBranch_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticStaff" ADD CONSTRAINT "DiagnosticStaff_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticStaff" ADD CONSTRAINT "DiagnosticStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticStaff" ADD CONSTRAINT "DiagnosticStaff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "DiagnosticBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticDepartment" ADD CONSTRAINT "DiagnosticDepartment_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticTest" ADD CONSTRAINT "DiagnosticTest_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticTest" ADD CONSTRAINT "DiagnosticTest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DiagnosticDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticPackage" ADD CONSTRAINT "DiagnosticPackage_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticPackageItem" ADD CONSTRAINT "DiagnosticPackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "DiagnosticPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticPackageItem" ADD CONSTRAINT "DiagnosticPackageItem_testId_fkey" FOREIGN KEY ("testId") REFERENCES "DiagnosticTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

