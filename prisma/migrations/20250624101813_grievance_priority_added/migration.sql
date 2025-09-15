-- CreateEnum
CREATE TYPE "GrievancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "tbl_grievances" ADD COLUMN     "priority" "GrievancePriority" NOT NULL DEFAULT 'LOW';
