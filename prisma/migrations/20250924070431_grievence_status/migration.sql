/*
  Warnings:

  - The values [CRITICAL] on the enum `GrievancePriority` will be removed. If these variants are still used in the database, this will fail.
  - The values [IN_PROGRESS,REJECTED] on the enum `GrievanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [FINANCIAL] on the enum `GrievanceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GrievancePriority_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
ALTER TABLE "tbl_grievances" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "tbl_grievances" ALTER COLUMN "priority" TYPE "GrievancePriority_new" USING ("priority"::text::"GrievancePriority_new");
ALTER TYPE "GrievancePriority" RENAME TO "GrievancePriority_old";
ALTER TYPE "GrievancePriority_new" RENAME TO "GrievancePriority";
DROP TYPE "GrievancePriority_old";
ALTER TABLE "tbl_grievances" ALTER COLUMN "priority" SET DEFAULT 'LOW';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GrievanceStatus_new" AS ENUM ('NEW', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');
ALTER TABLE "tbl_grievances" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tbl_grievances" ALTER COLUMN "status" TYPE "GrievanceStatus_new" USING ("status"::text::"GrievanceStatus_new");
ALTER TYPE "GrievanceStatus" RENAME TO "GrievanceStatus_old";
ALTER TYPE "GrievanceStatus_new" RENAME TO "GrievanceStatus";
DROP TYPE "GrievanceStatus_old";
ALTER TABLE "tbl_grievances" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GrievanceType_new" AS ENUM ('TECHNICAL', 'OPERATIONAL', 'OTHER');
ALTER TABLE "tbl_grievances" ALTER COLUMN "type" TYPE "GrievanceType_new" USING ("type"::text::"GrievanceType_new");
ALTER TYPE "GrievanceType" RENAME TO "GrievanceType_old";
ALTER TYPE "GrievanceType_new" RENAME TO "GrievanceType";
DROP TYPE "GrievanceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "tbl_grievances" ADD COLUMN     "tags" TEXT[];
