import { WalletKeys, WalletStorage } from '@rahataid/wallet';
import { PrismaService } from '@rumsan/prisma';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class PostgresWalletStorage implements WalletStorage {
  private initialized = false;
  private readonly key: Buffer;

  constructor(private readonly prisma: PrismaService, encryptionKey: string) {
    if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey || '')) {
      throw new Error('WALLET_STORAGE_ENCRYPTION_KEY must be 64 hexadecimal characters');
    }
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  async init(): Promise<void> {
    await this.prisma.walletKey.findFirst({ select: { id: true } });
    this.initialized = true;
  }

  async isInitialized(): Promise<boolean> {
    return this.initialized;
  }

  async saveKey(wallet: WalletKeys): Promise<void> {
    const blockchain = wallet.blockchain.toLowerCase();
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    cipher.setAAD(Buffer.from(JSON.stringify([blockchain, wallet.address])));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(wallet), 'utf8'), cipher.final()]);
    const data = { nonce, ciphertext, tag: cipher.getAuthTag() };
    await this.prisma.walletKey.upsert({
      where: { blockchain_address: { blockchain, address: wallet.address } },
      create: { blockchain, address: wallet.address, ...data },
      update: data,
    });
  }

  async getKey(address: string, chain: string): Promise<WalletKeys | null> {
    const blockchain = chain.toLowerCase();
    const record = await this.prisma.walletKey.findUnique({
      where: { blockchain_address: { blockchain, address } },
    });
    if (!record) return null;
    const decipher = createDecipheriv('aes-256-gcm', this.key, record.nonce);
    decipher.setAAD(Buffer.from(JSON.stringify([blockchain, address])));
    decipher.setAuthTag(record.tag);
    const plaintext = Buffer.concat([decipher.update(record.ciphertext), decipher.final()]);
    const wallet: WalletKeys = JSON.parse(plaintext.toString('utf8'));
    if (wallet.address !== address || wallet.blockchain.toLowerCase() !== blockchain || !wallet.privateKey) {
      throw new Error('Stored wallet does not match the requested address and chain');
    }
    return wallet;
  }
}
