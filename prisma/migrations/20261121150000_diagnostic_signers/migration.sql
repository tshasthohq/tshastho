-- AlterTable
ALTER TABLE "DiagnosticOrderItem" ADD COLUMN     "signers" JSONB;

-- CreateTable
CREATE TABLE "DiagnosticSigner" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "degree" TEXT,
    "designation" TEXT,
    "regNo" TEXT,
    "signatureUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticSigner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiagnosticSigner_diagnosticId_role_isActive_idx" ON "DiagnosticSigner"("diagnosticId", "role", "isActive");

