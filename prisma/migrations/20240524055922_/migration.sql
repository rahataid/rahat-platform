-- CreateTable
CREATE TABLE "tbl_beneficiaries_gorup_projects" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "beneficiaryGroupId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_beneficiaries_gorup_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_gorup_projects_uuid_key" ON "tbl_beneficiaries_gorup_projects"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_gorup_projects_projectId_beneficiaryGroup_key" ON "tbl_beneficiaries_gorup_projects"("projectId", "beneficiaryGroupId");

-- AddForeignKey
ALTER TABLE "tbl_beneficiaries_gorup_projects" ADD CONSTRAINT "tbl_beneficiaries_gorup_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tbl_projects"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_beneficiaries_gorup_projects" ADD CONSTRAINT "tbl_beneficiaries_gorup_projects_beneficiaryGroupId_fkey" FOREIGN KEY ("beneficiaryGroupId") REFERENCES "tbl_beneficiaries_group"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
