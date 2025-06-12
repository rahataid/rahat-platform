import {
  ChainType,
  WalletKeys,
  WalletStorage,
  IWalletManager,
  IConnectedWallet,
} from '@rahataid/wallet';
import { Provider } from '@nestjs/common';

// Registry token for dependency injection
export const BLOCKCHAIN_REGISTRY_TOKEN = 'BLOCKCHAIN_REGISTRY';

// Generic wallet class type - any class that implements IWalletManager
type WalletClass = new (
  rpcUrl: string,
  storage: WalletStorage
) => IWalletManager;

// Configuration interface for registration
interface RegistryConfig {
  wallets: WalletClass[];
  storage: new (...args: any[]) => WalletStorage;
  defaultConfigs?: Record<string, { rpcUrl: string; [key: string]: any }>;
}

// Completely generic registry that makes no assumptions about wallet types
export class BlockchainProviderRegistry {
  private walletManagers = new Map<ChainType, IWalletManager>();
  private walletClasses = new Map<ChainType, WalletClass>();
  private storage: WalletStorage;
  private defaultConfigs: Record<
    string,
    { rpcUrl: string; [key: string]: any }
  >;

  constructor(
    storage: WalletStorage,
    walletClasses: WalletClass[] = [],
    defaultConfigs: Record<string, { rpcUrl: string; [key: string]: any }> = {}
  ) {
    this.storage = storage;
    this.defaultConfigs = defaultConfigs;
    this.registerWalletClasses(walletClasses);
  }

  // Static method for NestJS module registration with object config
  static register(config: RegistryConfig): Provider {
    return {
      provide: BLOCKCHAIN_REGISTRY_TOKEN,
      useFactory: async () => {
        // Create storage instance
        const storage = new config.storage();
        await storage.init();

        // Create registry with wallet classes and optional default configs
        return new BlockchainProviderRegistry(
          storage,
          config.wallets,
          config.defaultConfigs || {}
        );
      },
    };
  }

  // Register wallet classes generically by reading their blockchainType
  private registerWalletClasses(walletClasses: WalletClass[]): void {
    walletClasses.forEach((WalletClass) => {
      // Create temporary instance to read blockchainType property
      const tempInstance = new WalletClass('dummy-url', this.storage);
      const blockchainType = (tempInstance as any).blockchainType;

      if (!blockchainType) {
        throw new Error(
          `Wallet class ${WalletClass.name} does not expose blockchainType property`
        );
      }

      // Convert blockchainType to lowercase ChainType
      const chainType = blockchainType.toLowerCase() as ChainType;

      this.walletClasses.set(chainType, WalletClass);
    });
  }

  // Initialize any registered wallet manager for a chain
  async initializeChain(chainType: ChainType, config?: any): Promise<void> {
    const WalletClass = this.walletClasses.get(chainType);
    if (!WalletClass) {
      throw new Error(
        `No wallet class registered for chain type: ${chainType}`
      );
    }

    // Use provided config, fall back to default config, or require explicit config
    const walletConfig = config || this.defaultConfigs[chainType];

    if (!walletConfig?.rpcUrl) {
      throw new Error(
        `No RPC URL provided for chain type: ${chainType}. ` +
          `Provide config in initializeChain() or set defaultConfigs in module registration.`
      );
    }

    const walletManager = new WalletClass(walletConfig.rpcUrl, this.storage);
    await walletManager.init();
    this.walletManagers.set(chainType, walletManager);
  }

  // Get available wallet classes (for introspection)
  getRegisteredChainTypes(): ChainType[] {
    return Array.from(this.walletClasses.keys());
  }

  // Get wallet manager for specific chain
  getWalletManager(chainType: ChainType): IWalletManager {
    const walletManager = this.walletManagers.get(chainType);
    if (!walletManager) {
      throw new Error(
        `No wallet manager initialized for chain type: ${chainType}`
      );
    }
    return walletManager;
  }

  // Get supported chains (only initialized ones)
  getSupportedChains(): ChainType[] {
    return Array.from(this.walletManagers.keys());
  }

  // Generic methods using IWalletManager interface
  async createWallet(chainType: ChainType): Promise<WalletKeys> {
    const walletManager = this.getWalletManager(chainType);
    const connectedWallet: IConnectedWallet =
      await walletManager.createWallet();
    return connectedWallet.getWalletKeys();
  }

  async connectWallet(
    address: string,
    chainType: ChainType
  ): Promise<IConnectedWallet> {
    const walletManager = this.getWalletManager(chainType);
    return walletManager.connect(address, chainType);
  }

  async importWallet(
    privateKey: string,
    chainType: ChainType
  ): Promise<WalletKeys> {
    const walletManager = this.getWalletManager(chainType);
    const connectedWallet: IConnectedWallet = await walletManager.importWallet(
      privateKey
    );
    return connectedWallet.getWalletKeys();
  }

  // Generic address validation with fallback patterns
  validateAddress(address: string, chainType: ChainType): boolean {
    const walletManager = this.walletManagers.get(chainType);

    // If wallet manager has validation method, use it
    if (
      walletManager &&
      typeof (walletManager as any).validateAddress === 'function'
    ) {
      return (walletManager as any).validateAddress(address);
    }

    // Fallback to basic pattern matching for common chains
    return this.basicAddressValidation(address, chainType);
  }

  // Auto-detect chain from address format using patterns (avoid circular dependency)
  detectChainFromAddress(address: string): ChainType {
    // Use basic patterns first to avoid circular dependency with validation
    if (
      address.startsWith('0x') &&
      address.length === 42 &&
      /^0x[a-fA-F0-9]{40}$/.test(address)
    ) {
      return 'evm';
    }
    if (
      address.length === 56 &&
      address.startsWith('G') &&
      /^G[A-Z2-7]{55}$/.test(address)
    ) {
      return 'stellar';
    }

    // If patterns don't match, try wallet validation for registered chains
    for (const chainType of this.getRegisteredChainTypes()) {
      try {
        const walletManager = this.walletManagers.get(chainType);
        if (
          walletManager &&
          typeof (walletManager as any).validateAddress === 'function'
        ) {
          if ((walletManager as any).validateAddress(address)) {
            return chainType;
          }
        }
      } catch {
        // Wallet validation failed, continue
        continue;
      }
    }

    throw new Error(
      `Cannot detect chain type from address: ${address}. ` +
        `No registered wallet can validate this address format.`
    );
  }

  // Get wallet keys from storage
  async getWalletKeys(
    address: string,
    chainType: ChainType
  ): Promise<WalletKeys | null> {
    return this.storage.getKey(address, chainType);
  }

  // Basic address validation patterns as fallback
  private basicAddressValidation(
    address: string,
    chainType: ChainType
  ): boolean {
    switch (chainType) {
      case 'evm':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'stellar':
        return /^G[A-Z2-7]{55}$/.test(address);
      default:
        // For unknown chain types, return false
        return false;
    }
  }
}
