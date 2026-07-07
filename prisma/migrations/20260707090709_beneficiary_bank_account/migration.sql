-- CreateTable
CREATE TABLE "tbl_beneficiary_bank_accounts" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "beneficiaryId" UUID NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankId" TEXT,
    "branchId" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "info" TEXT,
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_beneficiary_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_bank_accounts_uuid_key" ON "tbl_beneficiary_bank_accounts"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_bank_accounts_beneficiaryId_key" ON "tbl_beneficiary_bank_accounts"("beneficiaryId");

-- CreateIndex
CREATE INDEX "tbl_beneficiary_bank_accounts_deletedAt_idx" ON "tbl_beneficiary_bank_accounts"("deletedAt");

-- AddForeignKey
ALTER TABLE "tbl_beneficiary_bank_accounts" ADD CONSTRAINT "tbl_beneficiary_bank_accounts_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "tbl_beneficiaries"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
