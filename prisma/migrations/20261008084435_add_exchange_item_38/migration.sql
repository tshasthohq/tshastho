-- AlterEnum
ALTER TYPE "ReturnType" ADD VALUE 'EXCHANGE';

-- AlterTable
ALTER TABLE "ReturnOrder" ADD COLUMN     "exchangeDifference" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "exchangeDifferenceMethod" TEXT,
ADD COLUMN     "exchangeOutAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "exchangeOutItems" JSONB;
