-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "AudienceType" AS ENUM ('USER', 'ROLE', 'PERMISSION', 'PROJECT_MEMBERS', 'ALL');

-- AlterTable
ALTER TABLE "tbl_notifications" ADD COLUMN     "channels" "NotificationChannel"[] DEFAULT ARRAY[]::"NotificationChannel"[];

-- CreateTable
CREATE TABLE "tbl_notifications_audience" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "type" "AudienceType" NOT NULL,
    "value" JSONB,
    "exclude" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tbl_notifications_audience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_notifications_audience_notificationId_idx" ON "tbl_notifications_audience"("notificationId");

-- AddForeignKey
ALTER TABLE "tbl_notifications_audience" ADD CONSTRAINT "tbl_notifications_audience_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "tbl_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
