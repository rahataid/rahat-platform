/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `tbl_grievances` will be added. If there are existing duplicate values, this will fail.
  - The required column `uuid` was added to the `tbl_grievances` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "tbl_grievances" ADD COLUMN     "uuid" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_grievances_uuid_key" ON "tbl_grievances"("uuid");
