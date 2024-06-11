/*
  Warnings:

  - You are about to drop the column `groupName` on the `tbl_temp_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `targetUUID` on the `tbl_temp_beneficiaries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_temp_beneficiaries" DROP COLUMN "groupName",
DROP COLUMN "targetUUID";
