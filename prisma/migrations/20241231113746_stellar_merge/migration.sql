-- AlterTable
ALTER TABLE "tbl_users" ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "updatedBy" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "tbl_stellar_cw" (
    "uuid" UUID NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,
    "stellarPublicAddress" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_stellar_cw_uuid_key" ON "tbl_stellar_cw"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_stellar_cw_beneficiaryId_key" ON "tbl_stellar_cw"("beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_stellar_cw_stellarPublicAddress_key" ON "tbl_stellar_cw"("stellarPublicAddress");

-- AddForeignKey
ALTER TABLE "tbl_stellar_cw" ADD CONSTRAINT "tbl_stellar_cw_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "tbl_beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
