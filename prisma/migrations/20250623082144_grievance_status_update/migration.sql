/*
  Warnings:

  - The values [UNDER_REVIEW] on the enum `GrievanceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GrievanceStatus_new" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');
ALTER TABLE "tbl_grievances" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tbl_grievances" ALTER COLUMN "status" TYPE "GrievanceStatus_new" USING ("status"::text::"GrievanceStatus_new");
ALTER TYPE "GrievanceStatus" RENAME TO "GrievanceStatus_old";
ALTER TYPE "GrievanceStatus_new" RENAME TO "GrievanceStatus";
DROP TYPE "GrievanceStatus_old";
ALTER TABLE "tbl_grievances" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;
