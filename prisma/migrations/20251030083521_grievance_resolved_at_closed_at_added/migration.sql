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

-- AlterTable
ALTER TABLE "tbl_grievances" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedAt" TIMESTAMP(3);
