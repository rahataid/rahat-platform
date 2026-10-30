-- CreateTable
CREATE TABLE "tbl_chain_configs" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "chainId" TEXT,
    "rpcUrl" TEXT[],
    "explorerUrl" TEXT,
    "currencyName" TEXT,
    "currencySymbol" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "contractDetails" JSONB,
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_chain_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_wallet_addresses" (
    "id" SERIAL NOT NULL,
    "entityId" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "chainType" TEXT NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_wallet_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_chain_configs_uuid_key" ON "tbl_chain_configs"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_chain_configs_name_key" ON "tbl_chain_configs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_wallet_addresses_address_key" ON "tbl_wallet_addresses"("address");
