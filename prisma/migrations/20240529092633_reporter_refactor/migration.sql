/*
  Warnings:

  - You are about to drop the column `reportedById` on the `tbl_grievances` table. All the data in the column will be lost.
  - Added the required column `reportedBy` to the `tbl_grievances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reporterUserId` to the `tbl_grievances` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tbl_grievances" DROP CONSTRAINT "tbl_grievances_reportedById_fkey";

-- AlterTable
ALTER TABLE "tbl_grievances" DROP COLUMN "reportedById",
ADD COLUMN     "reportedBy" TEXT NOT NULL,
ADD COLUMN     "reporterUserId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "tbl_grievances" ADD CONSTRAINT "tbl_grievances_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
