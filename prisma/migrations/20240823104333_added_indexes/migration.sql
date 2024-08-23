-- CreateIndex
CREATE INDEX "tbl_beneficiaries_deletedAt_idx" ON "tbl_beneficiaries"("deletedAt");

-- CreateIndex
CREATE INDEX "tbl_beneficiaries_gorup_projects_projectId_idx" ON "tbl_beneficiaries_gorup_projects"("projectId");

-- CreateIndex
CREATE INDEX "tbl_beneficiaries_gorup_projects_beneficiaryGroupId_idx" ON "tbl_beneficiaries_gorup_projects"("beneficiaryGroupId");

-- CreateIndex
CREATE INDEX "tbl_beneficiaries_gorup_projects_deletedAt_idx" ON "tbl_beneficiaries_gorup_projects"("deletedAt");

-- CreateIndex
CREATE INDEX "tbl_beneficiaries_group_deletedAt_idx" ON "tbl_beneficiaries_group"("deletedAt");

-- CreateIndex
CREATE INDEX "tbl_beneficiaries_projects_projectId_idx" ON "tbl_beneficiaries_projects"("projectId");

-- CreateIndex
CREATE INDEX "tbl_beneficiaries_projects_beneficiaryId_idx" ON "tbl_beneficiaries_projects"("beneficiaryId");

-- CreateIndex
CREATE INDEX "tbl_beneficiaries_projects_deletedAt_idx" ON "tbl_beneficiaries_projects"("deletedAt");

-- CreateIndex
CREATE INDEX "tbl_grouped_beneficiaries_beneficiaryGroupId_idx" ON "tbl_grouped_beneficiaries"("beneficiaryGroupId");

-- CreateIndex
CREATE INDEX "tbl_grouped_beneficiaries_beneficiaryId_idx" ON "tbl_grouped_beneficiaries"("beneficiaryId");

-- CreateIndex
CREATE INDEX "tbl_grouped_beneficiaries_deletedAt_idx" ON "tbl_grouped_beneficiaries"("deletedAt");
