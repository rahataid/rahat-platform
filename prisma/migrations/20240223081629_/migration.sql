-- CreateTable
CREATE TABLE "tbl_beneficiaries_projects" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "beneficiaryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_beneficiaries_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_projects_uuid_key" ON "tbl_beneficiaries_projects"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiaries_projects_projectId_beneficiaryId_key" ON "tbl_beneficiaries_projects"("projectId", "beneficiaryId");

-- AddForeignKey
ALTER TABLE "tbl_beneficiaries_projects" ADD CONSTRAINT "tbl_beneficiaries_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tbl_projects"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_beneficiaries_projects" ADD CONSTRAINT "tbl_beneficiaries_projects_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "tbl_beneficiaries"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
