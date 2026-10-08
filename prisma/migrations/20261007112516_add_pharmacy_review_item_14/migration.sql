-- AlterTable
ALTER TABLE "Pharmacy" ADD COLUMN     "avgRating" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "ratingBreakdown" JSONB,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "pharmacy_reviews" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "flaggedBy" TEXT,
    "flagReason" TEXT,
    "replyText" TEXT,
    "repliedAt" TIMESTAMP(3),
    "repliedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_reviews_orderId_key" ON "pharmacy_reviews"("orderId");

-- CreateIndex
CREATE INDEX "pharmacy_reviews_pharmacyId_status_createdAt_idx" ON "pharmacy_reviews"("pharmacyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "pharmacy_reviews_customerId_idx" ON "pharmacy_reviews"("customerId");

-- CreateIndex
CREATE INDEX "pharmacy_reviews_rating_idx" ON "pharmacy_reviews"("rating");

-- AddForeignKey
ALTER TABLE "pharmacy_reviews" ADD CONSTRAINT "pharmacy_reviews_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_reviews" ADD CONSTRAINT "pharmacy_reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_reviews" ADD CONSTRAINT "pharmacy_reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
