/*
  Warnings:

  - The `age` column on the `tbl_beneficiaries` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tbl_beneficiaries" DROP COLUMN "age",
ADD COLUMN     "age" DOUBLE PRECISION;
