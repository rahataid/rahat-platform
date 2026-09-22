import { Logger } from '@nestjs/common';
import { WalletKeys, WalletStorage } from '@rahataid/wallet';
import { PrismaService } from '@rumsan/prisma';

/**
 * DatabaseWalletStorage does NOT persist wallets on saveKey().
 * Instead, wallets are saved to DB only when assignEntity() is called
 * during the entity-creation transaction.
 */
export class DatabaseWalletStorage implements WalletStorage {
  private readonly logger = new Logger(DatabaseWalletStorage.name);

  constructor(private readonly prisma: PrismaService) { }

  async init(): Promise<void> {
    // Connection lifecycle is managed by NestJS / PrismaService
  }

  /**
   * No-op - DB storage does not write on wallet creation.
   * Wallets are saved during entity creation via assignEntity().
   */
  async saveKey(keys: WalletKeys): Promise<void> {
    this.logger.debug(`DB saveKey called for ${keys.address} (no-op - will be assigned later)`);
  }

  /**
   * No-op batch version
   */
  async saveBulk(keys: WalletKeys[]): Promise<void> {
    this.logger.debug(`DB saveBulk called for ${keys.length} wallets (no-op)`);
  }

  /**
   * Read wallet from database
   */
  async getKey(address: string, blockchain: string): Promise<WalletKeys | null> {
    const record = await this.prisma.walletAddress.findFirst({
      where: {
        address: { equals: address, mode: 'insensitive' },
        chainType: { equals: blockchain, mode: 'insensitive' },
      },
    });

    if (!record?.config) return null;

    const cfg = record.config as Record<string, any>;
    return {
      address: record.address,
      privateKey: cfg['privateKey'],
      publicKey: cfg['publicKey'] ?? undefined,
      mnemonic: cfg['mnemonic'] ?? undefined,
      blockchain: record.chainType,
    };
  }

  async deleteWallet(address: string): Promise<void> {
    await this.prisma.walletAddress.deleteMany({ where: { address } });
  }

  /**
   * Creates wallet records in DB with the real entityId during entity creation.
   * This is called inside the transaction callback after the user/beneficiary is created.
   */
  static async assignEntity(
    tx: any,
    // : Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    wallets: { address: string; chain: string; privateKey: string; publicKey?: string; mnemonic?: string }[],
    entityId: string,
    primaryAddress: string
  ): Promise<void> {
    const data = wallets.map((w) => ({
      entityId,
      address: w.address,
      isPrimary: w.address === primaryAddress,
      isVerified: true,
      chainType: w.chain,
      config: {
        privateKey: w.privateKey ?? null,
        publicKey: w.publicKey ?? null,
        mnemonic: w.mnemonic ?? null,
        address: w.address,
        chain: w.chain,
      },
    }));

    await tx.walletAddress.createMany({
      data,
      skipDuplicates: true,
    });

    // this.logger.log(`Assigned ${wallets.length} wallets to entity ${entityId}`);
  }
}
