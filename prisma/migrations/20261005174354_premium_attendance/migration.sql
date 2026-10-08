-- AlterTable
ALTER TABLE "StaffAttendance" ADD COLUMN     "chamberId" TEXT,
ADD COLUMN     "checkInDevice" TEXT,
ADD COLUMN     "checkInDistanceM" INTEGER,
ADD COLUMN     "checkInIp" TEXT,
ADD COLUMN     "checkInLat" DECIMAL(65,30),
ADD COLUMN     "checkInLng" DECIMAL(65,30),
ADD COLUMN     "checkInSelfie" TEXT,
ADD COLUMN     "checkOutDevice" TEXT,
ADD COLUMN     "checkOutDistanceM" INTEGER,
ADD COLUMN     "checkOutIp" TEXT,
ADD COLUMN     "checkOutLat" DECIMAL(65,30),
ADD COLUMN     "checkOutLng" DECIMAL(65,30),
ADD COLUMN     "checkOutSelfie" TEXT,
ADD COLUMN     "earlyMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isEarlyLeave" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lateMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "manualReason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PRESENT';

-- CreateTable
CREATE TABLE "StaffShift" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "graceMinutes" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendanceRule" (
    "id" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 200,
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "lateGraceMinutes" INTEGER NOT NULL DEFAULT 10,
    "requireSelfie" BOOLEAN NOT NULL DEFAULT true,
    "requireGps" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAttendanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffShift_staffId_isActive_idx" ON "StaffShift"("staffId", "isActive");

-- CreateIndex
CREATE INDEX "StaffShift_chamberId_dayOfWeek_idx" ON "StaffShift"("chamberId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendanceRule_chamberId_key" ON "StaffAttendanceRule"("chamberId");

-- CreateIndex
CREATE INDEX "StaffAttendance_chamberId_date_idx" ON "StaffAttendance"("chamberId", "date");

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "DoctorChamber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "DoctorStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "DoctorChamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendanceRule" ADD CONSTRAINT "StaffAttendanceRule_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "DoctorChamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
