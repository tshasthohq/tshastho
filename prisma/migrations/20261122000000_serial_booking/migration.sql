-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "scheduleId" TEXT,
ADD COLUMN     "serialNo" INTEGER,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "DoctorSchedule" ADD COLUMN     "bookingMode" TEXT NOT NULL DEFAULT 'SLOT',
ADD COLUMN     "maxSerials" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_doctorId_date_scheduleId_serialNo_key" ON "Appointment"("doctorId", "date", "scheduleId", "serialNo");

