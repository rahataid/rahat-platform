/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `tbl_beneficiaries_group` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_group_name_key" ON "tbl_beneficiaries_group"("name");
