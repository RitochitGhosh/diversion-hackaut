/*
  Warnings:

  - You are about to drop the column `algoTxId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `walletAddress` on the `Subscription` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Subscription_algoTxId_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "algoTxId",
DROP COLUMN "walletAddress";
