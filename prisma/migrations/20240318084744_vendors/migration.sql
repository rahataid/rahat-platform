/*
  Warnings:

  - You are about to drop the column `extras` on the `tbl_projects_vendors` table. All the data in the column will be lost.
  - You are about to drop the column `service` on the `tbl_projects_vendors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_projects_vendors" DROP COLUMN "extras",
DROP COLUMN "service",
ALTER COLUMN "vendorId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "tbl_projects_vendors" ADD CONSTRAINT "tbl_projects_vendors_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "tbl_users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
