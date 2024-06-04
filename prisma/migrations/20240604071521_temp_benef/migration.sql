/*
  Warnings:

  - You are about to drop the `tbl_pending_beneficiaries` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "tbl_pending_beneficiaries";

-- CreateTable
CREATE TABLE "tbl_temp_beneficiaries" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "govtIDNumber" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "birthDate" TIMESTAMP(3),
    "walletAddress" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "bankedStatus" "BankedStatus" NOT NULL DEFAULT 'UNKNOWN',
    "internetStatus" "InternetStatus" NOT NULL DEFAULT 'UNKNOWN',
    "phoneStatus" "PhoneStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "extras" JSONB,
    "deletedAt" TIMESTAMP(3),
    "targetUUID" UUID NOT NULL,
    "groupName" TEXT,

    CONSTRAINT "tbl_temp_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_temp_beneficiaries_uuid_key" ON "tbl_temp_beneficiaries"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_temp_beneficiaries_targetUUID_key" ON "tbl_temp_beneficiaries"("targetUUID");
