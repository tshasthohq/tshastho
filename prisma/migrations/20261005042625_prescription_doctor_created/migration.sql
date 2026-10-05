-- CreateEnum
CREATE TYPE "PrescriptionSource" AS ENUM ('UPLOADED', 'DOCTOR_CREATED');

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "advice" TEXT,
ADD COLUMN     "appointmentId" TEXT,
ADD COLUMN     "chiefComplaint" TEXT,
ADD COLUMN     "examination" TEXT,
ADD COLUMN     "followUpDate" TEXT,
ADD COLUMN     "followUpNotes" TEXT,
ADD COLUMN     "investigations" TEXT,
ADD COLUMN     "prescriptionPdf" TEXT,
ADD COLUMN     "source" "PrescriptionSource" NOT NULL DEFAULT 'UPLOADED';

-- AlterTable
ALTER TABLE "PrescriptionItem" ADD COLUMN     "beforeAfterMeal" TEXT,
ADD COLUMN     "route" TEXT,
ADD COLUMN     "unit" TEXT;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
