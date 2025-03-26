/*
  Warnings:

  - Added the required column `privateKey` to the `tbl_users_wallets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_users_wallets" ADD COLUMN     "privateKey" TEXT NOT NULL;
