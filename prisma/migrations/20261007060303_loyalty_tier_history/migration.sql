-- CreateTable
CREATE TABLE "LoyaltyTierHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldTier" TEXT NOT NULL,
    "newTier" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'THRESHOLD_REACHED',
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTierHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoyaltyTierHistory_userId_createdAt_idx" ON "LoyaltyTierHistory"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "LoyaltyTierHistory" ADD CONSTRAINT "LoyaltyTierHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
