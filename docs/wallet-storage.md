# Wallet key storage

The default `WALLET_STORAGE_BACKEND=file` preserves existing filesystem
behavior and uses `WALLET_PATH`. To use encrypted PostgreSQL storage, apply the
Prisma migrations, set `WALLET_STORAGE_BACKEND=postgres`, and provide a
64-character hexadecimal `WALLET_STORAGE_ENCRYPTION_KEY` containing 32 random
bytes. Generate one with `openssl rand -hex 32` and store it in a secret
manager, separately from database backups. Back up the key securely: without
it, stored wallet keys cannot be recovered. Every instance using the same
database must use the same key.

Each wallet payload, including any mnemonic, is encrypted with AES-256-GCM
using a fresh nonce and authenticated against its chain and address. Rotating
or losing the key without decrypting and re-encrypting existing records makes
them unreadable. Database access controls and secure deployment practices are
still required.

Switching backends does not migrate existing filesystem wallets. Do not switch
an existing deployment until its wallet keys have been securely migrated and
verified; retain protected backups of both the old storage and the key.
