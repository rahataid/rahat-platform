/*
  Warnings:

  - Added the required column `chainType` to the `tbl_projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_projects" ADD COLUMN     "chainType" TEXT NOT NULL;
