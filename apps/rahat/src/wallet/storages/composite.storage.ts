import { Logger } from '@nestjs/common';
import { WalletKeys, WalletStorage } from '@rahataid/wallet';

/**
 * Writes to all storages; reads from the first one that returns a result.
 * Primary storage (index 0) is tried first on reads.
 */
export class CompositeWalletStorage implements WalletStorage {
  private readonly logger = new Logger(CompositeWalletStorage.name);

  constructor(private readonly storages: WalletStorage[]) {
    if (storages.length === 0) throw new Error('CompositeWalletStorage requires at least one storage');
  }

  async init(): Promise<void> {
    await Promise.all(this.storages.map((s) => s.init()));
  }

  async saveKey(keys: WalletKeys): Promise<void> {
    await Promise.all(this.storages.map((s) => s.saveKey(keys)));
  }

  async saveBulk(keys: WalletKeys[]): Promise<void> {
    await Promise.all(
      this.storages.map((s) => (s.saveBulk ? s.saveBulk(keys) : Promise.all(keys.map((k) => s.saveKey(k)))))
    );
  }

  async getKey(address: string, blockchain: string): Promise<WalletKeys | null> {
    for (const s of this.storages) {
      try {
        const result = await s.getKey(address, blockchain);
        if (result) return result;
      } catch (err) {
        this.logger.warn(`Storage ${s.constructor.name} failed getKey: ${(err as Error).message}`);
      }
    }
    return null;
  }

  async deleteWallet(address: string): Promise<void> {
    await Promise.all(
      this.storages.map((s) => (s.deleteWallet ? s.deleteWallet(address) : Promise.resolve()))
    );
  }
}
