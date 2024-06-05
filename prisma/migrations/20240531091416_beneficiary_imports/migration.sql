-- CreateTable
CREATE TABLE "tbl_pending_beneficiaries" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_pending_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_pending_beneficiaries_group" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_pending_beneficiaries_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_pending_grouped_beneficiaries" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "beneficiaryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_pending_grouped_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_pending_beneficiaries_uuid_key" ON "tbl_pending_beneficiaries"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_pending_beneficiaries_group_uuid_key" ON "tbl_pending_beneficiaries_group"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_pending_grouped_beneficiaries_uuid_key" ON "tbl_pending_grouped_beneficiaries"("uuid");
