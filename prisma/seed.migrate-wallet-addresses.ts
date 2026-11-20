/**
 * Migration: Populate tbl_wallet_addresses from existing entity wallet fields.
 *
 * Covers:
 *   - tbl_beneficiaries.walletAddress  → entityId = beneficiary.uuid
 *   - tbl_users.wallet                 → entityId = user.uuid
 *   - tbl_vendors.wallet               → entityId = vendor.uuid
 *
 * Key details (privateKey, publicKey, mnemonic) are read from wallet_storage
 * files ({CHAIN}_{address}.json) when available.
 *
 * Idempotent: skips addresses already present in tbl_wallet_addresses.
 * chainType is auto-detected from address format; falls back to CHAIN_SETTINGS
 * in tbl_settings, then 'evm'.
 *
 * Run:
 *   ts-node prisma/seed.migrate-wallet-addresses.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();

// ─── file wallet storage ─────────────────────────────────────────────────────

const WALLET_STORAGE_DIR =
  process.env.WALLET_PATH ??
  path.join(__dirname, '..', 'wallet_storage');

interface WalletKeys {
  address: string;
  privateKey: string | null;
  publicKey?: string | null;
  mnemonic?: string | null;
  blockchain: string;
}

async function readWalletFile(address: string, chainType: string): Promise<WalletKeys | null> {
  const filePath = path.join(
    WALLET_STORAGE_DIR,
    `${chainType.toUpperCase()}_${address}.json`,
  );
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as WalletKeys;
  } catch {
    return null;
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Detect chain type from address format. */
function detectChainType(address: string): string {
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) return 'evm';
  if (/^G[A-Z2-7]{55}$/.test(address)) return 'stellar';
  return 'unknown';
}

async function getDefaultChainType(): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { name: 'CHAIN_SETTINGS' },
    select: { value: true },
  });
  const type = (setting?.value as Record<string, any>)?.type;
  return typeof type === 'string' && type ? type.toLowerCase() : 'evm';
}

function resolveChainType(address: string, fallback: string): string {
  const detected = detectChainType(address);
  return detected !== 'unknown' ? detected : fallback;
}

// ─── config builder ──────────────────────────────────────────────────────────

async function buildConfig(address: string, chainType: string): Promise<any> {
  const keys = await readWalletFile(address, chainType);
  return {
    address,
    chain: chainType,
    privateKey: keys?.privateKey ?? null,
    publicKey: keys?.publicKey ?? null,
    mnemonic: keys?.mnemonic ?? null,
  };
}

// ─── entity processors ──────────────────────────────────────────────────────

async function migrateBeneficiaries(
  existingAddresses: Set<string>,
  defaultChain: string,
): Promise<number> {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { walletAddress: { not: '' }, deletedAt: null },
    select: { uuid: true, walletAddress: true },
  });

  const pending = beneficiaries.filter(
    (b) => b.walletAddress && !existingAddresses.has(b.walletAddress.toLowerCase()),
  );

  const rows = await Promise.all(
    pending.map(async (b) => {
      const chainType = resolveChainType(b.walletAddress, defaultChain);
      return {
        entityId: b.uuid,
        address: b.walletAddress,
        isPrimary: true,
        isVerified: false,
        chainType,
        config: await buildConfig(b.walletAddress, chainType),
      };
    }),
  );

  if (rows.length === 0) return 0;
  const result = await prisma.walletAddress.createMany({ data: rows, skipDuplicates: true });
  return result.count;
}

async function migrateUsers(
  existingAddresses: Set<string>,
  defaultChain: string,
): Promise<number> {
  const users = await prisma.user.findMany({
    where: { wallet: { not: null }, deletedAt: null },
    select: { uuid: true, wallet: true },
  });

  const pending = users.filter(
    (u) => u.wallet && !existingAddresses.has(u.wallet.toLowerCase()),
  );

  const rows = await Promise.all(
    pending.map(async (u) => {
      const chainType = resolveChainType(u.wallet!, defaultChain);
      return {
        entityId: u.uuid,
        address: u.wallet!,
        isPrimary: true,
        isVerified: false,
        chainType,
        config: await buildConfig(u.wallet!, chainType),
      };
    }),
  );

  if (rows.length === 0) return 0;
  const result = await prisma.walletAddress.createMany({ data: rows, skipDuplicates: true });
  return result.count;
}

async function migrateVendors(
  existingAddresses: Set<string>,
  defaultChain: string,
): Promise<number> {
  const vendors = await prisma.vendors.findMany({
    where: { wallet: { not: null }, deletedAt: null },
    select: { uuid: true, wallet: true },
  });

  const pending = vendors.filter(
    (v) => v.wallet && !existingAddresses.has(v.wallet.toLowerCase()),
  );

  const rows = await Promise.all(
    pending.map(async (v) => {
      const chainType = resolveChainType(v.wallet!, defaultChain);
      return {
        entityId: v.uuid,
        address: v.wallet!,
        isPrimary: true,
        isVerified: false,
        chainType,
        config: await buildConfig(v.wallet!, chainType),
      };
    }),
  );

  if (rows.length === 0) return 0;
  const result = await prisma.walletAddress.createMany({ data: rows, skipDuplicates: true });
  return result.count;
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Wallet Address Migration ===\n');

  const defaultChain = await getDefaultChainType();
  console.log(`Default chain fallback: ${defaultChain}`);

  // Load existing addresses once to skip duplicates without relying solely on skipDuplicates
  const existing = await prisma.walletAddress.findMany({ select: { address: true } });
  const existingAddresses = new Set(existing.map((r) => r.address.toLowerCase()));
  console.log(`Existing wallet_address rows: ${existingAddresses.size}\n`);

  const benCount = await migrateBeneficiaries(existingAddresses, defaultChain);
  console.log(`Beneficiaries migrated: ${benCount}`);

  const userCount = await migrateUsers(existingAddresses, defaultChain);
  console.log(`Users migrated:         ${userCount}`);

  const vendorCount = await migrateVendors(existingAddresses, defaultChain);
  console.log(`Vendors migrated:       ${vendorCount}`);

  console.log(`\nTotal new rows inserted: ${benCount + userCount + vendorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
