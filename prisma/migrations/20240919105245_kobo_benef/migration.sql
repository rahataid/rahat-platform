-- CreateEnum
CREATE TYPE "KoboBeneficiaryType" AS ENUM ('SALE', 'LEAD', 'HOME_VISIT');

-- CreateTable
CREATE TABLE "tbl_kobo_beneficiaries" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "healthWorkerName" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "type" "KoboBeneficiaryType" NOT NULL DEFAULT 'SALE',
    "phone" TEXT NOT NULL,
    "age" INTEGER,
    "email" TEXT,
    "wallet" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "leadInterests" TEXT[],
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_kobo_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_kobo_beneficiaries_uuid_key" ON "tbl_kobo_beneficiaries"("uuid");
