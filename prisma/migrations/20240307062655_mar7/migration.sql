-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "tbl_vendors" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "wallet" TEXT,
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_projects_vendors" (
    "id" SERIAL NOT NULL,
    "projectId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "service" "Service" NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_projects_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_transactions" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "beneficiaryId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendors_uuid_key" ON "tbl_vendors"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_projects_vendors_projectId_vendorId_key" ON "tbl_projects_vendors"("projectId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_transactions_uuid_key" ON "tbl_transactions"("uuid");

-- AddForeignKey
ALTER TABLE "tbl_projects_vendors" ADD CONSTRAINT "tbl_projects_vendors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tbl_projects"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
