/*
  Warnings:

  - You are about to drop the column `bankedStatus` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `extras` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `internetStatus` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `phoneStatus` on the `tbl_beneficiaries` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneNumber]` on the table `tbl_beneficiaries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[walletAddress]` on the table `tbl_beneficiaries` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullName` to the `tbl_beneficiaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `tbl_beneficiaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `walletAddress` to the `tbl_beneficiaries` table without a default value. This is not possible if the table is not empty.
  - Made the column `updatedAt` on table `tbl_beneficiaries` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BeneficiaryTypes" AS ENUM ('ENROLLED', 'REFERRED');

-- AlterTable
ALTER TABLE "tbl_beneficiaries" DROP COLUMN "bankedStatus",
DROP COLUMN "birthDate",
DROP COLUMN "email",
DROP COLUMN "extras",
DROP COLUMN "firstName",
DROP COLUMN "internetStatus",
DROP COLUMN "lastName",
DROP COLUMN "latitude",
DROP COLUMN "location",
DROP COLUMN "longitude",
DROP COLUMN "notes",
DROP COLUMN "phone",
DROP COLUMN "phoneStatus",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "beneficiariesReferred" INTEGER,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "referralBeneficiary" TEXT,
ADD COLUMN     "referralVendor" TEXT,
ADD COLUMN     "type" "BeneficiaryTypes" NOT NULL DEFAULT 'ENROLLED',
DROP COLUMN "walletAddress",
ADD COLUMN     "walletAddress" BYTEA NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_phoneNumber_key" ON "tbl_beneficiaries"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_walletAddress_key" ON "tbl_beneficiaries"("walletAddress");

-- AddForeignKey
ALTER TABLE "tbl_beneficiaries" ADD CONSTRAINT "tbl_beneficiaries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tbl_projects"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
