/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `tbl_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[usernameLower]` on the table `tbl_users` will be added. If there are existing duplicate values, this will fail.

*/
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

-- AlterEnum
ALTER TYPE "Service" ADD VALUE 'USERNAME';

-- AlterTable
ALTER TABLE "tbl_auth" ADD COLUMN     "lastFailedAt" TIMESTAMP(3),
ADD COLUMN     "lockCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "serviceIdLower" TEXT;

-- AlterTable
ALTER TABLE "tbl_users" ADD COLUMN     "username" TEXT,
ADD COLUMN     "usernameLower" TEXT;

-- CreateTable
CREATE TABLE "tbl_login_attempts" (
    "id" SERIAL NOT NULL,
    "authId" INTEGER,
    "identifier" TEXT NOT NULL,
    "service" "Service" NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_login_attempts_ip_createdAt_idx" ON "tbl_login_attempts"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "tbl_login_attempts_identifier_createdAt_idx" ON "tbl_login_attempts"("identifier", "createdAt");

-- CreateIndex
CREATE INDEX "tbl_login_attempts_authId_createdAt_idx" ON "tbl_login_attempts"("authId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_username_key" ON "tbl_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_usernameLower_key" ON "tbl_users"("usernameLower");

-- AddForeignKey
ALTER TABLE "tbl_login_attempts" ADD CONSTRAINT "tbl_login_attempts_authId_fkey" FOREIGN KEY ("authId") REFERENCES "tbl_auth"("id") ON DELETE SET NULL ON UPDATE CASCADE;
