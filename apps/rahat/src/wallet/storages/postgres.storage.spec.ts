import { WalletKeys } from '@rahataid/wallet';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@rumsan/prisma';
import { PostgresWalletStorage } from './postgres.storage';

describe('PostgresWalletStorage', () => {
  const key = 'ab'.repeat(32);
  const wallet: WalletKeys = {
    address: 'wallet-address',
    blockchain: 'EVM',
    privateKey: 'sensitive-private-key',
    mnemonic: 'sensitive-mnemonic',
  };
  let prisma: PrismaService;
  let storage: PostgresWalletStorage;
  let records: Map<string, { ciphertext: Buffer; nonce: Buffer; tag: Buffer }>;

  beforeEach(async () => {
    records = new Map();
    const mock = {
      walletKey: {
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(async ({ create }) => {
          records.set(`${create.blockchain}:${create.address}`, create);
        }),
        findUnique: jest.fn(async ({ where }) => {
          const { blockchain, address } = where.blockchain_address;
          return records.get(`${blockchain}:${address}`) || null;
        }),
      },
    };
    const module = await Test.createTestingModule({
      providers: [{ provide: PrismaService, useValue: mock }],
    }).compile();
    prisma = module.get(PrismaService);
    storage = new PostgresWalletStorage(prisma, key);
  });

  it('initializes after checking the database table', async () => {
    expect(await storage.isInitialized()).toBe(false);
    await storage.init();
    expect(prisma.walletKey.findFirst).toHaveBeenCalledWith({ select: { id: true } });
    expect(await storage.isInitialized()).toBe(true);
  });

  it('encrypts and recovers wallet keys and distinguishes chains', async () => {
    await storage.saveKey(wallet);
    const saved = records.get('evm:wallet-address');
    expect(saved.ciphertext.toString()).not.toContain(wallet.privateKey);
    expect(saved.ciphertext.toString()).not.toContain(wallet.mnemonic);
    await expect(storage.getKey(wallet.address, 'evm')).resolves.toEqual(wallet);
    await expect(storage.getKey(wallet.address, 'stellar')).resolves.toBeNull();
    const previousNonce = saved.nonce;
    await storage.saveKey(wallet);
    expect(records.get('evm:wallet-address').nonce.equals(previousNonce)).toBe(false);
  });

  it('rejects tampered ciphertext, changed identity, or a wrong key', async () => {
    await storage.saveKey(wallet);
    const saved = records.get('evm:wallet-address');
    records.set('stellar:wallet-address', saved);
    await expect(storage.getKey(wallet.address, 'stellar')).rejects.toThrow();
    const other = new PostgresWalletStorage(prisma, 'cd'.repeat(32));
    await expect(other.getKey(wallet.address, 'evm')).rejects.toThrow();
    saved.ciphertext[0] ^= 1;
    await expect(storage.getKey(wallet.address, 'evm')).rejects.toThrow();
  });

  it('rejects a missing or invalid encryption key', () => {
    expect(() => new PostgresWalletStorage(prisma, '')).toThrow('64 hexadecimal characters');
    expect(() => new PostgresWalletStorage(prisma, 'z'.repeat(64))).toThrow('64 hexadecimal characters');
  });

  it('propagates database failures', async () => {
    jest.mocked(prisma.walletKey.findFirst).mockRejectedValue(new Error('database unavailable'));
    await expect(storage.init()).rejects.toThrow('database unavailable');
    expect(await storage.isInitialized()).toBe(false);
  });
});
