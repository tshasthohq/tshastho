-- CreateEnum
CREATE TYPE "DoctorStaffRole" AS ENUM ('RECEPTIONIST', 'ASSISTANT', 'NURSE', 'COMPOUNDER', 'MANAGER', 'OTHER');

-- CreateEnum
CREATE TYPE "DoctorStaffStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateTable
CREATE TABLE "DoctorStaff" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "DoctorStaffRole" NOT NULL DEFAULT 'ASSISTANT',
    "status" "DoctorStaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "permissions" JSONB,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffChamberAssignment" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffChamberAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "date" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorStaff_userId_key" ON "DoctorStaff"("userId");

-- CreateIndex
CREATE INDEX "DoctorStaff_doctorId_status_idx" ON "DoctorStaff"("doctorId", "status");

-- CreateIndex
CREATE INDEX "DoctorStaff_userId_idx" ON "DoctorStaff"("userId");

-- CreateIndex
CREATE INDEX "StaffChamberAssignment_chamberId_idx" ON "StaffChamberAssignment"("chamberId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffChamberAssignment_staffId_chamberId_key" ON "StaffChamberAssignment"("staffId", "chamberId");

-- CreateIndex
CREATE INDEX "StaffAttendance_staffId_date_idx" ON "StaffAttendance"("staffId", "date");

-- CreateIndex
CREATE INDEX "StaffAttendance_date_idx" ON "StaffAttendance"("date");

-- AddForeignKey
ALTER TABLE "DoctorStaff" ADD CONSTRAINT "DoctorStaff_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorStaff" ADD CONSTRAINT "DoctorStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffChamberAssignment" ADD CONSTRAINT "StaffChamberAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "DoctorStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffChamberAssignment" ADD CONSTRAINT "StaffChamberAssignment_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "DoctorChamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "DoctorStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
