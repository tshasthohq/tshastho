-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING');

-- CreateEnum
CREATE TYPE "HistoryType" AS ENUM ('CONDITION', 'SURGERY', 'HOSPITALIZATION', 'PROCEDURE');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('FULL_HISTORY', 'SPECIFIC_REPORTS', 'CURRENT_VISIT', 'PRESCRIPTIONS_ONLY');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "PatientAllergy" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DRUG',
    "severity" "AllergySeverity" NOT NULL DEFAULT 'MODERATE',
    "reaction" TEXT,
    "notedBy" TEXT,
    "notedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientCondition" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HistoryType" NOT NULL DEFAULT 'CONDITION',
    "diagnosedDate" TIMESTAMP(3),
    "hospital" TEXT,
    "doctorName" TEXT,
    "notes" TEXT,
    "isChronic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientMedication" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isOngoing" BOOLEAN NOT NULL DEFAULT true,
    "prescribedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientMedication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientFamilyHistory" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientFamilyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorPatientConsent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "scope" "ConsentScope" NOT NULL DEFAULT 'FULL_HISTORY',
    "status" "ConsentStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "accessLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorPatientConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalHistoryAccessLog" (
    "id" TEXT NOT NULL,
    "consentId" TEXT,
    "patientId" TEXT NOT NULL,
    "accessedById" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalHistoryAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientAllergy_patientId_isActive_idx" ON "PatientAllergy"("patientId", "isActive");

-- CreateIndex
CREATE INDEX "PatientCondition_patientId_isActive_idx" ON "PatientCondition"("patientId", "isActive");

-- CreateIndex
CREATE INDEX "PatientCondition_patientId_type_idx" ON "PatientCondition"("patientId", "type");

-- CreateIndex
CREATE INDEX "PatientMedication_patientId_isOngoing_idx" ON "PatientMedication"("patientId", "isOngoing");

-- CreateIndex
CREATE INDEX "PatientFamilyHistory_patientId_idx" ON "PatientFamilyHistory"("patientId");

-- CreateIndex
CREATE INDEX "DoctorPatientConsent_doctorId_status_idx" ON "DoctorPatientConsent"("doctorId", "status");

-- CreateIndex
CREATE INDEX "DoctorPatientConsent_patientId_status_idx" ON "DoctorPatientConsent"("patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorPatientConsent_patientId_doctorId_key" ON "DoctorPatientConsent"("patientId", "doctorId");

-- CreateIndex
CREATE INDEX "MedicalHistoryAccessLog_patientId_createdAt_idx" ON "MedicalHistoryAccessLog"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "MedicalHistoryAccessLog_accessedById_idx" ON "MedicalHistoryAccessLog"("accessedById");

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCondition" ADD CONSTRAINT "PatientCondition_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedication" ADD CONSTRAINT "PatientMedication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientFamilyHistory" ADD CONSTRAINT "PatientFamilyHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPatientConsent" ADD CONSTRAINT "DoctorPatientConsent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPatientConsent" ADD CONSTRAINT "DoctorPatientConsent_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalHistoryAccessLog" ADD CONSTRAINT "MedicalHistoryAccessLog_accessedById_fkey" FOREIGN KEY ("accessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
