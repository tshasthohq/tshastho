-- CreateEnum
CREATE TYPE "InteractionSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATED');

-- CreateTable
CREATE TABLE "DrugInteraction" (
    "id" TEXT NOT NULL,
    "drug1Name" TEXT NOT NULL,
    "drug1Generic" TEXT,
    "drug2Name" TEXT NOT NULL,
    "drug2Generic" TEXT,
    "severity" "InteractionSeverity" NOT NULL DEFAULT 'MODERATE',
    "description" TEXT NOT NULL,
    "recommendation" TEXT,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionInteractionCheck" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "interactionId" TEXT,
    "drug1Name" TEXT NOT NULL,
    "drug2Name" TEXT NOT NULL,
    "severity" "InteractionSeverity" NOT NULL,
    "description" TEXT,
    "wasAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionInteractionCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DrugInteraction_drug1Name_idx" ON "DrugInteraction"("drug1Name");

-- CreateIndex
CREATE INDEX "DrugInteraction_drug2Name_idx" ON "DrugInteraction"("drug2Name");

-- CreateIndex
CREATE INDEX "DrugInteraction_drug1Generic_idx" ON "DrugInteraction"("drug1Generic");

-- CreateIndex
CREATE INDEX "DrugInteraction_drug2Generic_idx" ON "DrugInteraction"("drug2Generic");

-- CreateIndex
CREATE INDEX "PrescriptionInteractionCheck_prescriptionId_idx" ON "PrescriptionInteractionCheck"("prescriptionId");

-- CreateIndex
CREATE INDEX "PrescriptionInteractionCheck_severity_idx" ON "PrescriptionInteractionCheck"("severity");

-- AddForeignKey
ALTER TABLE "PrescriptionInteractionCheck" ADD CONSTRAINT "PrescriptionInteractionCheck_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionInteractionCheck" ADD CONSTRAINT "PrescriptionInteractionCheck_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
