/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress]` on the table `tbl_beneficiaries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `tbl_beneficiaries_pii` will be added. If there are existing duplicate values, this will fail.
  - Made the column `walletAddress` on table `tbl_beneficiaries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `tbl_beneficiaries_pii` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_beneficiaries" ADD COLUMN     "ageRange" TEXT,
ALTER COLUMN "walletAddress" SET NOT NULL;

-- AlterTable
ALTER TABLE "tbl_beneficiaries_pii" ALTER COLUMN "phone" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_walletAddress_key" ON "tbl_beneficiaries"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_pii_phone_key" ON "tbl_beneficiaries_pii"("phone");
