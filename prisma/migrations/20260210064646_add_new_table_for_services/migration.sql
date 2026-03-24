-- AlterEnum
ALTER TYPE "GrievancePriority" ADD VALUE 'CRITICAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GrievanceStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "GrievanceStatus" ADD VALUE 'REJECTED';

-- AlterEnum
ALTER TYPE "GrievanceType" ADD VALUE 'FINANCIAL';

-- CreateTable
CREATE TABLE "tbl_service_clients" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canImpersonate" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" INTEGER,

    CONSTRAINT "tbl_service_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_service_clients_clientId_key" ON "tbl_service_clients"("clientId");
