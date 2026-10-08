-- CreateEnum
CREATE TYPE "ReferralPriority" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('FITNESS', 'SICK_LEAVE', 'MEDICAL_FITNESS', 'DISABILITY', 'VACCINATION', 'SURGERY', 'OTHER');

-- CreateTable
CREATE TABLE "DoctorReferralCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "referringDoctorId" TEXT NOT NULL,
    "consultingDoctorId" TEXT,
    "patientId" TEXT NOT NULL,
    "priority" "ReferralPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "clinicalSummary" TEXT,
    "questionForSpecialist" TEXT,
    "consultingNotes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorReferralCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCertificate" (
    "id" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT,
    "localPatientId" TEXT,
    "type" "CertificateType" NOT NULL DEFAULT 'FITNESS',
    "title" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "diagnosis" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "restDays" INTEGER,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureUrl" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpReminder" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "prescriptionId" TEXT,
    "reminderDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorReferralCase_caseNumber_key" ON "DoctorReferralCase"("caseNumber");

-- CreateIndex
CREATE INDEX "DoctorReferralCase_referringDoctorId_status_idx" ON "DoctorReferralCase"("referringDoctorId", "status");

-- CreateIndex
CREATE INDEX "DoctorReferralCase_consultingDoctorId_status_idx" ON "DoctorReferralCase"("consultingDoctorId", "status");

-- CreateIndex
CREATE INDEX "DoctorReferralCase_patientId_idx" ON "DoctorReferralCase"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCertificate_certificateNo_key" ON "MedicalCertificate"("certificateNo");

-- CreateIndex
CREATE INDEX "MedicalCertificate_doctorId_createdAt_idx" ON "MedicalCertificate"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "MedicalCertificate_patientId_idx" ON "MedicalCertificate"("patientId");

-- CreateIndex
CREATE INDEX "MedicalCertificate_localPatientId_idx" ON "MedicalCertificate"("localPatientId");

-- CreateIndex
CREATE INDEX "FollowUpReminder_doctorId_reminderDate_idx" ON "FollowUpReminder"("doctorId", "reminderDate");

-- CreateIndex
CREATE INDEX "FollowUpReminder_patientId_reminderDate_idx" ON "FollowUpReminder"("patientId", "reminderDate");

-- CreateIndex
CREATE INDEX "FollowUpReminder_reminderDate_isCompleted_idx" ON "FollowUpReminder"("reminderDate", "isCompleted");

-- AddForeignKey
ALTER TABLE "DoctorReferralCase" ADD CONSTRAINT "DoctorReferralCase_referringDoctorId_fkey" FOREIGN KEY ("referringDoctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorReferralCase" ADD CONSTRAINT "DoctorReferralCase_consultingDoctorId_fkey" FOREIGN KEY ("consultingDoctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorReferralCase" ADD CONSTRAINT "DoctorReferralCase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_localPatientId_fkey" FOREIGN KEY ("localPatientId") REFERENCES "LocalPatient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpReminder" ADD CONSTRAINT "FollowUpReminder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpReminder" ADD CONSTRAINT "FollowUpReminder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
