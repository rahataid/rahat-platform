-- CreateTable
CREATE TABLE "tbl_notifications" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" UUID,
    "description" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_notifications" ADD CONSTRAINT "tbl_notifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tbl_projects"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
