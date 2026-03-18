/*
  Warnings:

  - The values [NON_TECHNICAL] on the enum `GrievanceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GrievanceType_new" AS ENUM ('TECHNICAL', 'OPERATIONAL', 'FINANCIAL', 'OTHER');
ALTER TABLE "tbl_grievances" ALTER COLUMN "type" TYPE "GrievanceType_new" USING ("type"::text::"GrievanceType_new");
ALTER TYPE "GrievanceType" RENAME TO "GrievanceType_old";
ALTER TYPE "GrievanceType_new" RENAME TO "GrievanceType";
DROP TYPE "GrievanceType_old";
COMMIT;
