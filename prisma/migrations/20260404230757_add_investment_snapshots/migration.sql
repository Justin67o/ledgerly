/*
  Warnings:

  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "type" "CategoryType" NOT NULL;

-- CreateTable
CREATE TABLE "NetWorthSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TEXT NOT NULL,

    CONSTRAINT "NetWorthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentAccountSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TEXT NOT NULL,

    CONSTRAINT "InvestmentAccountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TEXT NOT NULL,

    CONSTRAINT "InvestmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NetWorthSnapshot" ADD CONSTRAINT "NetWorthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentAccountSnapshot" ADD CONSTRAINT "InvestmentAccountSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentSnapshot" ADD CONSTRAINT "InvestmentSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
