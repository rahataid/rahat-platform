/*
  Warnings:

  - Made the column `walletAddress` on table `tbl_temp_beneficiaries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "tbl_temp_beneficiaries_targetUUID_key";

-- AlterTable
ALTER TABLE "tbl_temp_beneficiaries" ALTER COLUMN "walletAddress" SET NOT NULL;
