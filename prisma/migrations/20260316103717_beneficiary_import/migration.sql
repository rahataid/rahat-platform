-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('NEW', 'PROCESSING', 'IMPORTED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "tbl_beneficiary_imports" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "r2Key" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "groupUUID" UUID NOT NULL,
    "beneficiaryCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_beneficiary_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_imports_uuid_key" ON "tbl_beneficiary_imports"("uuid");
