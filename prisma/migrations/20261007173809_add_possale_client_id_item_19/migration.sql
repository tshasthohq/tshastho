/*
  Warnings:

  - A unique constraint covering the columns `[clientSaleId]` on the table `PosSale` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PosSale" ADD COLUMN     "clientSaleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PosSale_clientSaleId_key" ON "PosSale"("clientSaleId");
