/*
  Warnings:

  - You are about to drop the column `uuid` on the `tbl_device_tokens` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "tbl_device_tokens_uuid_key";

-- AlterTable
ALTER TABLE "tbl_device_tokens" DROP COLUMN "uuid",
ALTER COLUMN "userId" SET DATA TYPE TEXT;
