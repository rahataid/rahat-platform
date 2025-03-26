-- CreateTable
CREATE TABLE "tbl_vendor_wallets" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "chain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_vendor_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendor_wallets_vendorId_chain_key" ON "tbl_vendor_wallets"("vendorId", "chain");

-- AddForeignKey
ALTER TABLE "tbl_vendor_wallets" ADD CONSTRAINT "tbl_vendor_wallets_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "tbl_vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
