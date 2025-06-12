import {
  ChainType,
  WalletKeys,
  WalletStorage,
  IWalletManager,
  IConnectedWallet,
} from '@rahataid/wallet';
import { EVMWallet } from '@rahataid/wallet';
import { StellarWallet } from '@rahataid/wallet';

export interface IWalletProvider {
  readonly chainType: ChainType;
  initialize(config: any): Promise<void>;
  createWallet(): Promise<WalletKeys>;
  getWalletKeys(address: string): Promise<WalletKeys>;
  validateAddress(address: string): boolean;
}

export class BlockchainProviderRegistry {
  private walletManagers = new Map<ChainType, IWalletManager>();
  private storage: WalletStorage;

  constructor(storage: WalletStorage) {
    this.storage = storage;
  }

  async initializeChain(chainType: ChainType, config: any): Promise<void> {
    let walletManager: IWalletManager;

    switch (chainType) {
      case 'evm': {
        const evmConfig = config || {
          rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
        };

        walletManager = new EVMWallet(evmConfig.rpcUrl, this.storage);
        await walletManager.init();
        break;
      }

      case 'stellar': {
        const stellarConfig = config || {
          rpcUrl: 'https://stellar-soroban-public.nodies.app',
        };

        walletManager = new StellarWallet(stellarConfig.rpcUrl, this.storage);
        await walletManager.init();
        break;
      }

      default:
        throw new Error(`Unsupported chain type: ${chainType}`);
    }

    this.walletManagers.set(chainType, walletManager);
  }

  getWalletManager(chainType: ChainType): IWalletManager {
    const walletManager = this.walletManagers.get(chainType);
    if (!walletManager) {
      throw new Error(
        `No wallet manager initialized for chain type: ${chainType}`
      );
    }
    return walletManager;
  }

  getSupportedChains(): ChainType[] {
    return Array.from(this.walletManagers.keys());
  }

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

  validateAddress(address: string, chainType: ChainType): boolean {
    switch (chainType) {
      case 'evm':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'stellar':
        return /^G[A-Z2-7]{55}$/.test(address);
      default:
        return false;
    }
  }

  detectChainFromAddress(address: string): ChainType {
    if (address.startsWith('0x') && address.length === 42) {
      return 'evm';
    }
    if (address.length === 56 && address.startsWith('G')) {
      return 'stellar';
    }
    throw new Error(`Cannot detect chain type from address: ${address}`);
  }

  async getWalletKeys(
    address: string,
    chainType: ChainType
  ): Promise<WalletKeys | null> {
    return this.storage.getKey(address, chainType);
  }
}
