-- CreateEnum
CREATE TYPE "HospitalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "HospitalMemberRole" AS ENUM ('OWNER', 'ADMIN', 'BRANCH_MANAGER', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT', 'LAB_STAFF', 'PHARMACIST');

-- CreateEnum
CREATE TYPE "HospitalMemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "HospitalInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "about" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "registrationNo" TEXT,
    "licenseNo" TEXT,
    "licenseDocUrl" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BD',
    "status" "HospitalStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalBranch" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "city" TEXT,
    "district" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BD',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "emergencyPhone" TEXT,
    "is24x7" BOOLEAN NOT NULL DEFAULT false,
    "hasEmergency" BOOLEAN NOT NULL DEFAULT false,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bedCount" INTEGER,
    "openTime" TEXT,
    "closeTime" TEXT,
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalDepartment" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HospitalDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalMember" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HospitalMemberRole" NOT NULL,
    "status" "HospitalMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "branchIds" TEXT[],
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalInvite" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "HospitalMemberRole" NOT NULL,
    "branchIds" TEXT[],
    "tokenHash" TEXT NOT NULL,
    "status" "HospitalInviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HospitalInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalAuditLog" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HospitalAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_slug_key" ON "Hospital"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_licenseNo_key" ON "Hospital"("licenseNo");

-- CreateIndex
CREATE INDEX "Hospital_status_country_idx" ON "Hospital"("status", "country");

-- CreateIndex
CREATE INDEX "HospitalBranch_city_isActive_idx" ON "HospitalBranch"("city", "isActive");

-- CreateIndex
CREATE INDEX "HospitalBranch_hospitalId_isActive_idx" ON "HospitalBranch"("hospitalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalBranch_hospitalId_code_key" ON "HospitalBranch"("hospitalId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalDepartment_branchId_name_key" ON "HospitalDepartment"("branchId", "name");

-- CreateIndex
CREATE INDEX "HospitalMember_userId_idx" ON "HospitalMember"("userId");

-- CreateIndex
CREATE INDEX "HospitalMember_hospitalId_role_status_idx" ON "HospitalMember"("hospitalId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalMember_hospitalId_userId_key" ON "HospitalMember"("hospitalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalInvite_tokenHash_key" ON "HospitalInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "HospitalInvite_hospitalId_status_idx" ON "HospitalInvite"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "HospitalAuditLog_hospitalId_createdAt_idx" ON "HospitalAuditLog"("hospitalId", "createdAt");

-- AddForeignKey
ALTER TABLE "HospitalBranch" ADD CONSTRAINT "HospitalBranch_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalDepartment" ADD CONSTRAINT "HospitalDepartment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "HospitalBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalMember" ADD CONSTRAINT "HospitalMember_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalMember" ADD CONSTRAINT "HospitalMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalInvite" ADD CONSTRAINT "HospitalInvite_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalAuditLog" ADD CONSTRAINT "HospitalAuditLog_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

