-- CreateEnum
CREATE TYPE "HospitalDoctorStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REMOVED');

-- CreateTable
CREATE TABLE "HospitalDoctor" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "department" TEXT,
    "designation" TEXT,
    "status" "HospitalDoctorStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalDoctor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HospitalDoctor_doctorId_status_idx" ON "HospitalDoctor"("doctorId", "status");

-- CreateIndex
CREATE INDEX "HospitalDoctor_hospitalId_status_idx" ON "HospitalDoctor"("hospitalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalDoctor_branchId_doctorId_key" ON "HospitalDoctor"("branchId", "doctorId");

-- AddForeignKey
ALTER TABLE "HospitalDoctor" ADD CONSTRAINT "HospitalDoctor_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalDoctor" ADD CONSTRAINT "HospitalDoctor_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "HospitalBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalDoctor" ADD CONSTRAINT "HospitalDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

