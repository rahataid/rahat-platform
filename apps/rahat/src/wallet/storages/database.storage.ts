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
   * Persists wallet keys to database immediately.
   * Used when wallets need to be stored before entity assignment.
   */
  async saveKey(keys: WalletKeys, entityId?: string): Promise<void> {
    await this.prisma.walletAddress.create({
      data: {
        entityId: entityId || '00000000-0000-0000-0000-000000000000', // No entity yet - will be assigned later if needed
        address: keys.address,
        isPrimary: false,
        isVerified: true,
        chainType: keys.blockchain,
        config: {
          privateKey: keys.privateKey ?? null,
          publicKey: keys.publicKey ?? null,
          mnemonic: keys.mnemonic ?? null,
          address: keys.address,
          chain: keys.blockchain,
        },
      },
      // skipDuplicates: true,
    });
    this.logger.debug(`DB saveKey persisted wallet for ${keys.address}`);
  }

  /**
   * Batch version - persists multiple wallets to database immediately
   */
  async saveBulk(keysArray: WalletKeys[]): Promise<void> {
    const data = keysArray.map((k) => ({
      entityId: '00000000-0000-0000-0000-000000000000',
      address: k.address,
      isPrimary: false,
      isVerified: true,
      chainType: k.blockchain,
      config: {
        privateKey: k.privateKey ?? null,
        publicKey: k.publicKey ?? null,
        mnemonic: k.mnemonic ?? null,
        address: k.address,
        chain: k.blockchain,
      },
    }));

    await this.prisma.walletAddress.createMany({
      data,
      skipDuplicates: true,
    });
    this.logger.debug(`DB saveBulk persisted ${keysArray.length} wallets`);
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
   * Updates existing wallet records with the real entityId during entity creation.
   * Wallets should have been pre-created via saveBulk() or saveKey() with a placeholder entity ID.
   * This method finds those wallets by address+chain and updates only the entityId field.
   */
  static async assignEntity(
    tx: any,
    // : Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    wallets: { address: string; chain: string }[],
    entityId: string
  ): Promise<any> {
    console.log(wallets, entityId)
    const updatePromises = wallets.map(async (w) => {
      await tx.walletAddress.update({
        where: {
          address: w.address,
        },
        data: { entityId },
      });
    });

    return Promise.all(updatePromises);


    // this.logger.log(`Assigned ${wallets.length} wallets to entity ${entityId}`);
  }
}
