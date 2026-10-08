-- CreateEnum
CREATE TYPE "LocalPatientGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "WalkInEarningStatus" AS ENUM ('RECORDED', 'VOIDED');

-- AlterTable
ALTER TABLE "DoctorSchedule" ADD COLUMN     "chamberId" TEXT;

-- CreateTable
CREATE TABLE "DoctorChamber" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "gpsLatitude" DECIMAL(65,30),
    "gpsLongitude" DECIMAL(65,30),
    "mapUrl" TEXT,
    "defaultFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "operatingHours" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorChamber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalPatient" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "linkedUserId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "age" INTEGER,
    "gender" "LocalPatientGender",
    "bloodGroup" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "lastVisitDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalPatient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalPrescription" (
    "id" TEXT NOT NULL,
    "prescriptionNo" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "localPatientId" TEXT NOT NULL,
    "chamberId" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chiefComplaint" TEXT,
    "examination" TEXT,
    "diagnosis" TEXT,
    "investigations" TEXT,
    "advice" TEXT,
    "followUpDate" TEXT,
    "followUpNotes" TEXT,
    "notes" TEXT,
    "items" JSONB,
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isPrinted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalPrescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkInEarning" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "chamberId" TEXT,
    "localPatientId" TEXT,
    "patientName" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "serviceType" TEXT,
    "description" TEXT,
    "status" "WalkInEarningStatus" NOT NULL DEFAULT 'RECORDED',
    "earningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),
    "voidedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkInEarning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorChamber_doctorId_isActive_idx" ON "DoctorChamber"("doctorId", "isActive");

-- CreateIndex
CREATE INDEX "DoctorChamber_doctorId_isPrimary_idx" ON "DoctorChamber"("doctorId", "isPrimary");

-- CreateIndex
CREATE INDEX "LocalPatient_doctorId_createdAt_idx" ON "LocalPatient"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "LocalPatient_doctorId_phone_idx" ON "LocalPatient"("doctorId", "phone");

-- CreateIndex
CREATE INDEX "LocalPatient_linkedUserId_idx" ON "LocalPatient"("linkedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalPrescription_prescriptionNo_key" ON "LocalPrescription"("prescriptionNo");

-- CreateIndex
CREATE INDEX "LocalPrescription_doctorId_visitDate_idx" ON "LocalPrescription"("doctorId", "visitDate");

-- CreateIndex
CREATE INDEX "LocalPrescription_localPatientId_visitDate_idx" ON "LocalPrescription"("localPatientId", "visitDate");

-- CreateIndex
CREATE INDEX "LocalPrescription_chamberId_idx" ON "LocalPrescription"("chamberId");

-- CreateIndex
CREATE INDEX "WalkInEarning_doctorId_earningDate_idx" ON "WalkInEarning"("doctorId", "earningDate");

-- CreateIndex
CREATE INDEX "WalkInEarning_doctorId_chamberId_earningDate_idx" ON "WalkInEarning"("doctorId", "chamberId", "earningDate");

-- CreateIndex
CREATE INDEX "WalkInEarning_status_idx" ON "WalkInEarning"("status");

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "DoctorChamber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorChamber" ADD CONSTRAINT "DoctorChamber_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPatient" ADD CONSTRAINT "LocalPatient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPatient" ADD CONSTRAINT "LocalPatient_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPrescription" ADD CONSTRAINT "LocalPrescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPrescription" ADD CONSTRAINT "LocalPrescription_localPatientId_fkey" FOREIGN KEY ("localPatientId") REFERENCES "LocalPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPrescription" ADD CONSTRAINT "LocalPrescription_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "DoctorChamber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkInEarning" ADD CONSTRAINT "WalkInEarning_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkInEarning" ADD CONSTRAINT "WalkInEarning_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "DoctorChamber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkInEarning" ADD CONSTRAINT "WalkInEarning_localPatientId_fkey" FOREIGN KEY ("localPatientId") REFERENCES "LocalPatient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
