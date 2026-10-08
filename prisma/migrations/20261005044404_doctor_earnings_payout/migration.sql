-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'AVAILABLE', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "DoctorEarning" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "patientId" TEXT NOT NULL,
    "grossAmount" DECIMAL(65,30) NOT NULL,
    "platformFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(65,30) NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorPayout" (
    "id" TEXT NOT NULL,
    "payoutNumber" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "method" TEXT,
    "accountInfo" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorEarning_appointmentId_key" ON "DoctorEarning"("appointmentId");

-- CreateIndex
CREATE INDEX "DoctorEarning_doctorId_status_idx" ON "DoctorEarning"("doctorId", "status");

-- CreateIndex
CREATE INDEX "DoctorEarning_doctorId_createdAt_idx" ON "DoctorEarning"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "DoctorEarning_patientId_idx" ON "DoctorEarning"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorPayout_payoutNumber_key" ON "DoctorPayout"("payoutNumber");

-- CreateIndex
CREATE INDEX "DoctorPayout_doctorId_status_idx" ON "DoctorPayout"("doctorId", "status");

-- CreateIndex
CREATE INDEX "DoctorPayout_status_createdAt_idx" ON "DoctorPayout"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "DoctorEarning" ADD CONSTRAINT "DoctorEarning_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorEarning" ADD CONSTRAINT "DoctorEarning_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorEarning" ADD CONSTRAINT "DoctorEarning_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorEarning" ADD CONSTRAINT "DoctorEarning_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "DoctorPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPayout" ADD CONSTRAINT "DoctorPayout_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPayout" ADD CONSTRAINT "DoctorPayout_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
