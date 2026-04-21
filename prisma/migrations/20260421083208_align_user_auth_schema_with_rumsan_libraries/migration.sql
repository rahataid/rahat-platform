/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `tbl_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[usernameLower]` on the table `tbl_users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `tbl_users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ApplicationEnvironment" AS ENUM ('PRODUCTION', 'STAGING', 'DEVELOPMENT', 'TEST');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Service" ADD VALUE 'API';
ALTER TYPE "Service" ADD VALUE 'USERNAME';

-- AlterTable
ALTER TABLE "tbl_auth" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "lastFailedAt" TIMESTAMP(3),
ADD COLUMN     "lockCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "serviceIdLower" TEXT;

-- AlterTable
ALTER TABLE "tbl_users" ADD COLUMN     "username" TEXT,
ADD COLUMN     "usernameLower" TEXT,
ALTER COLUMN "name" SET NOT NULL;

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

-- CreateTable
CREATE TABLE "tbl_applications" (
    "cuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicKey" TEXT,
    "description" TEXT,
    "environment" "ApplicationEnvironment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_applications_pkey" PRIMARY KEY ("cuid")
);

-- CreateIndex
CREATE INDEX "tbl_login_attempts_ip_createdAt_idx" ON "tbl_login_attempts"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "tbl_login_attempts_identifier_createdAt_idx" ON "tbl_login_attempts"("identifier", "createdAt");

-- CreateIndex
CREATE INDEX "tbl_login_attempts_authId_createdAt_idx" ON "tbl_login_attempts"("authId", "createdAt");

-- CreateIndex
CREATE INDEX "tbl_auth_service_serviceIdLower_idx" ON "tbl_auth"("service", "serviceIdLower");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_username_key" ON "tbl_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_usernameLower_key" ON "tbl_users"("usernameLower");

-- AddForeignKey
ALTER TABLE "tbl_login_attempts" ADD CONSTRAINT "tbl_login_attempts_authId_fkey" FOREIGN KEY ("authId") REFERENCES "tbl_auth"("id") ON DELETE SET NULL ON UPDATE CASCADE;
