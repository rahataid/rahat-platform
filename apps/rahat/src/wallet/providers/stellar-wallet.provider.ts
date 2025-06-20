import { StellarWallet, WalletStorage } from '@rahataid/wallet';
import { IWalletProvider } from './blockchain-provider.registry';

export class StellarWalletProvider implements IWalletProvider {
  readonly chainType = 'stellar' as const;
  private stellarWallet: StellarWallet | null = null;

  constructor(private storage: WalletStorage) {}

  async initialize(config: any): Promise<void> {
    // Handle undefined config gracefully
    const stellarConfig = config || {
      rpcUrl: 'https://stellar-soroban-public.nodies.app',
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    };

    this.stellarWallet = new StellarWallet(stellarConfig.rpcUrl, this.storage);
    await this.stellarWallet.init();
  }

  async createWallet(): Promise<any> {
    if (!this.stellarWallet) {
      throw new Error('StellarWallet not initialized');
    }
    const wallet = await this.stellarWallet.createWallet();
    return wallet.getWalletKeys();
  }

  async getWalletKeys(address: string): Promise<any> {
    return this.storage.getKey(address, this.chainType);
  }

  validateAddress(address: string): boolean {
    return /^G[A-Z2-7]{55}$/.test(address);
  }
}
