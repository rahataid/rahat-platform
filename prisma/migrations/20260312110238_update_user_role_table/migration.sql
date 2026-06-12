-- AlterTable
ALTER TABLE "tbl_users_roles" ADD COLUMN     "projectId" UUID;

-- AddForeignKey
ALTER TABLE "tbl_users_roles" ADD CONSTRAINT "tbl_users_roles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tbl_projects"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
