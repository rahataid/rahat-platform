-- AlterTable
ALTER TABLE "tbl_projects" ADD COLUMN     "campaigns" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
