/*
  Warnings:

  - You are about to drop the column `name` on the `tbl_pending_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `tbl_pending_beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the `tbl_pending_beneficiaries_group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_pending_grouped_beneficiaries` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `firstName` to the `tbl_pending_beneficiaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `tbl_pending_beneficiaries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_pending_beneficiaries" DROP COLUMN "name",
DROP COLUMN "projectId",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bankedStatus" "BankedStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "govtIDNumber" TEXT,
ADD COLUMN     "groupName" TEXT,
ADD COLUMN     "internetStatus" "InternetStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phoneStatus" "PhoneStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "targetUUID" TEXT,
ADD COLUMN     "walletAddress" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- DropTable
DROP TABLE "tbl_pending_beneficiaries_group";

-- DropTable
DROP TABLE "tbl_pending_grouped_beneficiaries";
