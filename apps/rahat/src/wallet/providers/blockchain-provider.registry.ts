import { ChainType } from '@rahataid/wallet';

export interface IWalletProvider {
  readonly chainType: ChainType;
  initialize(config: any): Promise<void>;
  createWallet(): Promise<{
    chain: ChainType;
    address: string;
    privateKey: string;
  }>;
  getWalletKeys(address: string): Promise<{
    chain: ChainType;
    address: string;
    privateKey: string;
  }>;
  validateAddress(address: string): boolean;
}

export class BlockchainProviderRegistry {
  private providers = new Map<ChainType, IWalletProvider>();

  register(chainType: ChainType, provider: IWalletProvider): void {
    this.providers.set(chainType, provider);
  }

  getProvider(chainType: ChainType): IWalletProvider {
    const provider = this.providers.get(chainType);
    if (!provider) {
      throw new Error(`No provider registered for chain type: ${chainType}`);
    }
    return provider;
  }

  getSupportedChains(): ChainType[] {
    return Array.from(this.providers.keys());
  }
}
