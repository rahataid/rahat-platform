-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "GrievanceType" AS ENUM ('TECHNICAL', 'NON_TECHNICAL', 'OTHER');

-- CreateTable
CREATE TABLE "tbl_grievances" (
    "id" SERIAL NOT NULL,
    "reportedById" INTEGER NOT NULL,
    "reporterContact" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "GrievanceType" NOT NULL,
    "projectId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "status" "GrievanceStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_grievances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_grievances" ADD CONSTRAINT "tbl_grievances_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_grievances" ADD CONSTRAINT "tbl_grievances_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tbl_projects"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
