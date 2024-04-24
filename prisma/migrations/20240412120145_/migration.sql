/*
  Warnings:

  - You are about to alter the column `age` on the `tbl_beneficiaries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "tbl_beneficiaries" ALTER COLUMN "age" SET DATA TYPE INTEGER;
