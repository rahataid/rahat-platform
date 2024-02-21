/*
  Warnings:

  - You are about to drop the column `referralBeneficiary` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `referralVendor` on the `tbl_beneficiaries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_beneficiaries" DROP COLUMN "referralBeneficiary",
DROP COLUMN "referralVendor",
ADD COLUMN     "referrerBeneficiary" UUID,
ADD COLUMN     "referrerVendor" UUID;
