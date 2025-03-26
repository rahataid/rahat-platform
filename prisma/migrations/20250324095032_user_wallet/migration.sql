/*
  Warnings:

  - You are about to drop the `tbl_vendor_wallets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tbl_vendor_wallets" DROP CONSTRAINT "tbl_vendor_wallets_vendorId_fkey";

-- DropTable
DROP TABLE "tbl_vendor_wallets";

-- CreateTable
CREATE TABLE "tbl_users_wallets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "chain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_users_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_wallets_userId_chain_key" ON "tbl_users_wallets"("userId", "chain");

-- AddForeignKey
ALTER TABLE "tbl_users_wallets" ADD CONSTRAINT "tbl_users_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
