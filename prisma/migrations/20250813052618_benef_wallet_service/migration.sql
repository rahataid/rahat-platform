-- CreateEnum
CREATE TYPE "WalletService" AS ENUM ('INTERNAL', 'XCAPIT');

-- AlterTable
ALTER TABLE "tbl_beneficiaries" ADD COLUMN     "walletService" "WalletService" NOT NULL DEFAULT 'INTERNAL';
