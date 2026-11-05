-- CreateTable
CREATE TABLE "tbl_device_tokens" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_device_tokens_uuid_key" ON "tbl_device_tokens"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_device_tokens_token_key" ON "tbl_device_tokens"("token");

-- CreateIndex
CREATE INDEX "tbl_device_tokens_userId_active_idx" ON "tbl_device_tokens"("userId", "active");
