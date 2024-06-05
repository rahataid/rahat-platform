/*
  Warnings:

  - A unique constraint covering the columns `[targetUUID]` on the table `tbl_temp_beneficiaries` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tbl_temp_beneficiaries_targetUUID_key" ON "tbl_temp_beneficiaries"("targetUUID");
