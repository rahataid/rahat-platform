CREATE TABLE "tbl_wallet_keys" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "blockchain" TEXT NOT NULL,
    "ciphertext" BYTEA NOT NULL,
    "nonce" BYTEA NOT NULL,
    "tag" BYTEA NOT NULL,
    CONSTRAINT "tbl_wallet_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tbl_wallet_keys_blockchain_address_key"
    ON "tbl_wallet_keys"("blockchain", "address");
