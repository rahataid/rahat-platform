/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress]` on the table `tbl_beneficiaries` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_walletAddress_key" ON "tbl_beneficiaries"("walletAddress");
