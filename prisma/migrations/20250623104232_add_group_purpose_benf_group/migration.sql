-- CreateEnum
CREATE TYPE "GroupPurpose" AS ENUM ('BANK_TRANSFER', 'MOBILE_MONEY', 'COMMUNICATION');

-- AlterTable
ALTER TABLE "tbl_beneficiaries_group" ADD COLUMN     "groupPurpose" "GroupPurpose";
