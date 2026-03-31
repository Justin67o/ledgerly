/*
  Warnings:

  - Made the column `dateCreated` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `date` to the `Investment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "dateCreated" SET NOT NULL,
ALTER COLUMN "dateCreated" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "date" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "date" SET DATA TYPE TEXT;
