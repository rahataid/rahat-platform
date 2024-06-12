-- CreateTable
CREATE TABLE "tbl_temp_group" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_temp_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_temp_beneficiary_group" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "tempGroupUID" UUID NOT NULL,
    "tempBenefUID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_temp_beneficiary_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_temp_group_uuid_key" ON "tbl_temp_group"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_temp_group_name_key" ON "tbl_temp_group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_temp_beneficiary_group_uuid_key" ON "tbl_temp_beneficiary_group"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_temp_beneficiary_group_tempGroupUID_tempBenefUID_key" ON "tbl_temp_beneficiary_group"("tempGroupUID", "tempBenefUID");

-- AddForeignKey
ALTER TABLE "tbl_temp_beneficiary_group" ADD CONSTRAINT "tbl_temp_beneficiary_group_tempGroupUID_fkey" FOREIGN KEY ("tempGroupUID") REFERENCES "tbl_temp_group"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_temp_beneficiary_group" ADD CONSTRAINT "tbl_temp_beneficiary_group_tempBenefUID_fkey" FOREIGN KEY ("tempBenefUID") REFERENCES "tbl_temp_beneficiaries"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
