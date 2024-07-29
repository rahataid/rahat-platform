-- CreateEnum
CREATE TYPE "TokenDataType" AS ENUM ('IMPORTED', 'CREATED');

-- CreateTable
CREATE TABLE "tbl_tokens" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "decimals" INTEGER NOT NULL,
    "initialSupply" INTEGER NOT NULL,
    "fromBlock" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "transactionHash" TEXT,
    "type" "TokenDataType" NOT NULL DEFAULT 'CREATED',

    CONSTRAINT "tbl_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_tokens_uuid_key" ON "tbl_tokens"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_tokens_symbol_key" ON "tbl_tokens"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_tokens_fromBlock_key" ON "tbl_tokens"("fromBlock");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_tokens_contractAddress_key" ON "tbl_tokens"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_tokens_transactionHash_key" ON "tbl_tokens"("transactionHash");
