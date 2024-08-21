-- CreateTable
CREATE TABLE "tbl_auth_apps" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "nonceMessage" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_auth_apps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_auth_apps_uuid_key" ON "tbl_auth_apps"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_auth_apps_address_key" ON "tbl_auth_apps"("address");
