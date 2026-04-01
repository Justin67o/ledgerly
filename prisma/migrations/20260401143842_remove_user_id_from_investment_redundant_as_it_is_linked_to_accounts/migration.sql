/*
  Warnings:

  - You are about to drop the column `userId` on the `Investment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_userId_fkey";

-- AlterTable
ALTER TABLE "Investment" DROP COLUMN "userId";
