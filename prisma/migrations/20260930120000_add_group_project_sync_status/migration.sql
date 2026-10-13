-- CreateEnum
CREATE TYPE "GroupSyncStatus" AS ENUM ('PENDING', 'SYNCED');

-- AlterTable
ALTER TABLE "tbl_beneficiaries_gorup_projects" ADD COLUMN     "syncStatus" "GroupSyncStatus" NOT NULL DEFAULT 'SYNCED';
