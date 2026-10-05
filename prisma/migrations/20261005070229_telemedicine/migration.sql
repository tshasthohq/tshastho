-- CreateEnum
CREATE TYPE "TelemedicineStatus" AS ENUM ('SCHEDULED', 'WAITING', 'ACTIVE', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TelemedicineType" AS ENUM ('VIDEO', 'AUDIO', 'CHAT');

-- CreateTable
CREATE TABLE "TelemedicineSession" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "type" "TelemedicineType" NOT NULL DEFAULT 'VIDEO',
    "status" "TelemedicineStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "doctorJoined" BOOLEAN NOT NULL DEFAULT false,
    "patientJoined" BOOLEAN NOT NULL DEFAULT false,
    "doctorJoinedAt" TIMESTAMP(3),
    "patientJoinedAt" TIMESTAMP(3),
    "notes" TEXT,
    "prescriptionId" TEXT,
    "recordingUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelemedicineSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemedicineMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "message" TEXT,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemedicineMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelemedicineSession_appointmentId_key" ON "TelemedicineSession"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "TelemedicineSession_roomId_key" ON "TelemedicineSession"("roomId");

-- CreateIndex
CREATE INDEX "TelemedicineSession_doctorId_status_idx" ON "TelemedicineSession"("doctorId", "status");

-- CreateIndex
CREATE INDEX "TelemedicineSession_patientId_status_idx" ON "TelemedicineSession"("patientId", "status");

-- CreateIndex
CREATE INDEX "TelemedicineSession_scheduledAt_idx" ON "TelemedicineSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "TelemedicineMessage_sessionId_createdAt_idx" ON "TelemedicineMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "TelemedicineSession" ADD CONSTRAINT "TelemedicineSession_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemedicineSession" ADD CONSTRAINT "TelemedicineSession_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemedicineSession" ADD CONSTRAINT "TelemedicineSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
