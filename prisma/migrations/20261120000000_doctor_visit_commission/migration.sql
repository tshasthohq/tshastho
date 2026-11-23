-- CreateEnum
CREATE TYPE "VisitCommissionType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "VisitCommissionStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "DoctorAgent" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT,
    "agentType" TEXT NOT NULL DEFAULT 'AGENT',
    "phone" TEXT,
    "address" TEXT,
    "commissionType" "VisitCommissionType" NOT NULL DEFAULT 'PERCENT',
    "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorVisit" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "agentId" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientName" TEXT,
    "agentName" TEXT,
    "organization" TEXT,
    "visitFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "commissionType" "VisitCommissionType" NOT NULL DEFAULT 'PERCENT',
    "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "commissionAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netIncome" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "VisitCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorAgent_doctorId_idx" ON "DoctorAgent"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorVisit_doctorId_visitDate_idx" ON "DoctorVisit"("doctorId", "visitDate");

-- CreateIndex
CREATE INDEX "DoctorVisit_agentId_idx" ON "DoctorVisit"("agentId");

-- AddForeignKey
ALTER TABLE "DoctorAgent" ADD CONSTRAINT "DoctorAgent_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorVisit" ADD CONSTRAINT "DoctorVisit_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorVisit" ADD CONSTRAINT "DoctorVisit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "DoctorAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

