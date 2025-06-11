import { EVMWallet, WalletStorage } from '@rahataid/wallet';
import { IWalletProvider } from './blockchain-provider.registry';

export class EVMWalletProvider implements IWalletProvider {
  readonly chainType = 'evm' as const;
  private evmWallet: EVMWallet | null = null;

  constructor(private storage: WalletStorage) {}

  async initialize(config: any): Promise<void> {
    // Handle undefined config gracefully
    const evmConfig = config || {
      rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
      chainId: 84532,
    };

    this.evmWallet = new EVMWallet(evmConfig.rpcUrl, this.storage);
    await this.evmWallet.init();
  }

  async createWallet(): Promise<any> {
    if (!this.evmWallet) {
      throw new Error('EVMWallet not initialized');
    }
    const wallet = await this.evmWallet.createWallet();
    return wallet.getWalletKeys();
  }

  async getWalletKeys(address: string): Promise<any> {
    return this.storage.getKey(address, this.chainType);
  }

  validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
