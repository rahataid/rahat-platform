/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `tbl_beneficiaries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `tbl_vendors` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tbl_beneficiaries" ALTER COLUMN "phone" SET DEFAULT '';

-- AlterTable
ALTER TABLE "tbl_vendors" ALTER COLUMN "phone" SET DEFAULT '';

-- CreateTable
CREATE TABLE "tbl_offlineBeneficiaries" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT DEFAULT '',
    "walletAddress" BYTEA,
    "otp" TEXT NOT NULL,
    "otpHash" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_offlineBeneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OfflineBeneficiaryProjects" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_offlineBeneficiaries_uuid_key" ON "tbl_offlineBeneficiaries"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_offlineBeneficiaries_phone_key" ON "tbl_offlineBeneficiaries"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_offlineBeneficiaries_walletAddress_key" ON "tbl_offlineBeneficiaries"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_offlineBeneficiaries_otp_key" ON "tbl_offlineBeneficiaries"("otp");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_offlineBeneficiaries_otpHash_key" ON "tbl_offlineBeneficiaries"("otpHash");

-- CreateIndex
CREATE UNIQUE INDEX "_OfflineBeneficiaryProjects_AB_unique" ON "_OfflineBeneficiaryProjects"("A", "B");

-- CreateIndex
CREATE INDEX "_OfflineBeneficiaryProjects_B_index" ON "_OfflineBeneficiaryProjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_phone_key" ON "tbl_beneficiaries"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendors_phone_key" ON "tbl_vendors"("phone");

-- AddForeignKey
ALTER TABLE "_OfflineBeneficiaryProjects" ADD CONSTRAINT "_OfflineBeneficiaryProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "tbl_offlineBeneficiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfflineBeneficiaryProjects" ADD CONSTRAINT "_OfflineBeneficiaryProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "tbl_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
