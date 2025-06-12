import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  BulkCreateWallet,
  ChainType,
  IConnectedWallet,
  WalletKeys,
} from '@rahataid/wallet';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { BlockchainProviderRegistry } from './providers/blockchain-provider.registry';
import { FileWalletStorage } from './storages/fs.storage';

// Import the local providers

export interface WalletCreateResult {
  chain: ChainType;
  address: string;
  privateKey: string;
}

// TODO: Multi-chain support - Future enhancement to support multiple chains per instance
// Currently: One instance = One chain type
// Future: One instance = Multiple chain types with dynamic selection

@Injectable()
export class WalletService implements OnModuleInit {
  private readonly logger = new Logger(WalletService.name);
  private providerRegistry: BlockchainProviderRegistry;
  private currentChainType: ChainType; // TODO: Remove when multi-chain support is implemented

  constructor(
    private readonly settings: SettingsService,
    private readonly prisma: PrismaService
  ) {
    const storage = new FileWalletStorage();
    this.providerRegistry = new BlockchainProviderRegistry(storage);
  }

  async onModuleInit() {
    await this.initializeProviders();
  }

  private async initializeProviders() {
    this.logger.log('Initializing blockchain wallet managers...');

    // TODO: Multi-chain support - Currently detecting single chain from settings
    // Future: Support multiple chains simultaneously
    const chainSettings = await this.getCurrentChainSettings();
    this.currentChainType = chainSettings.detectedChain;

    this.logger.log(`Detected chain type: ${this.currentChainType}`);

    // Initialize the detected chain using IWalletManager
    await this.providerRegistry.initializeChain(
      this.currentChainType,
      chainSettings[this.currentChainType]
    );

    // TODO: Multi-chain support - Initialize all chains instead of just one
    // await this.providerRegistry.initializeChain('stellar', chainSettings.stellar);
    // await this.providerRegistry.initializeChain('evm', chainSettings.evm);

    this.logger.log(
      `Registered wallet managers: ${this.providerRegistry
        .getSupportedChains()
        .join(', ')}`
    );
  }

  // Dynamic wallet creation based on chain type
  async createWallet(chainType?: ChainType): Promise<WalletKeys> {
    // TODO: Multi-chain support - Remove currentChainType fallback
    const chain = chainType || this.currentChainType;

    this.logger.log(`Creating ${chain} wallet`);
    return this.providerRegistry.createWallet(chain);
  }

  // Multi-chain wallet creation
  async create(chains: ChainType[]): Promise<WalletCreateResult[]> {
    this.logger.log(`Creating wallets for chains: ${chains.join(', ')}`);

    // TODO: Multi-chain support - Currently limited to single chain per instance
    // For now, filter to only supported chains
    const supportedChains = chains.filter((chain) =>
      this.providerRegistry.getSupportedChains().includes(chain)
    );

    if (supportedChains.length === 0) {
      this.logger.warn(
        `No supported chains found in request: ${chains.join(', ')}`
      );
      supportedChains.push(this.currentChainType);
    }

    const chainWallets = await Promise.all(
      supportedChains.map(async (chain: ChainType) => {
        const walletKeys = await this.createWallet(chain);
        return {
          chain,
          address: walletKeys.address,
          privateKey: walletKeys.privateKey,
        };
      })
    );

    return chainWallets;
  }

  // Bulk wallet creation for a specific chain
  async createBulk(params: BulkCreateWallet): Promise<WalletCreateResult[]> {
    this.logger.log(`Creating ${params.count} ${params.chain} wallets`);

    // TODO: Multi-chain support - Validate chain is supported
    if (!this.providerRegistry.getSupportedChains().includes(params.chain)) {
      throw new Error(
        `Chain ${params.chain} is not supported in this instance`
      );
    }

    const walletPromises = Array.from({ length: params.count }, () =>
      this.createWallet(params.chain)
    );

    const wallets = await Promise.all(walletPromises);

    return wallets.map((wallet) => ({
      chain: params.chain,
      address: wallet.address,
      privateKey: wallet.privateKey,
    }));
  }

  // Get wallet secret by address and chain
  async getSecretByWallet(
    walletAddress: string,
    chain?: ChainType
  ): Promise<WalletKeys | null> {
    if (!walletAddress) {
      throw new Error('Wallet address not found');
    }

    // TODO: Multi-chain support - Currently limited to instance's supported chains
    const chains = chain ? [chain] : this.providerRegistry.getSupportedChains();

    for (const chainType of chains) {
      try {
        const walletKeys = await this.providerRegistry.getWalletKeys(
          walletAddress,
          chainType
        );
        if (walletKeys) {
          return walletKeys;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to get wallet keys for ${chainType}: ${error.message}`
        );
      }
    }

    return null;
  }

  async getSecretByPhone(
    phoneNumber: string,
    chain?: ChainType
  ): Promise<WalletKeys | null> {
    this.logger.log(`Getting secret by phone: ${phoneNumber}`);

    const walletAddress = await this.getWalletByPhone(phoneNumber);
    return this.getSecretByWallet(walletAddress, chain);
  }

  async getWalletByPhone(phoneNumber: string): Promise<string> {
    const result = await this.prisma.beneficiaryPii.findUnique({
      where: { phone: phoneNumber },
      select: {
        beneficiary: {
          select: { walletAddress: true },
        },
      },
    });

    if (!result) {
      throw new Error('Beneficiary not found');
    }

    return result.beneficiary.walletAddress;
  }

  // Connect to existing wallet
  async connectWallet(
    address: string,
    chain?: ChainType
  ): Promise<IConnectedWallet> {
    const chainType = chain || (await this.detectChainFromAddress(address));

    if (!this.providerRegistry.getSupportedChains().includes(chainType)) {
      throw new Error(`Chain ${chainType} not supported in this instance`);
    }

    return this.providerRegistry.connectWallet(address, chainType);
  }

  // Import wallet from private key
  async importWallet(
    privateKey: string,
    chain?: ChainType
  ): Promise<WalletKeys> {
    const chainType = chain || this.currentChainType;

    if (!this.providerRegistry.getSupportedChains().includes(chainType)) {
      throw new Error(`Chain ${chainType} not supported in this instance`);
    }

    return this.providerRegistry.importWallet(privateKey, chainType);
  }

  // Validation methods
  async validateAddress(address: string, chain?: ChainType): Promise<boolean> {
    const chainType = chain || (await this.detectChainFromAddress(address));

    // TODO: Multi-chain support - Remove this check when all chains are supported
    if (!this.providerRegistry.getSupportedChains().includes(chainType)) {
      this.logger.warn(`Chain ${chainType} not supported in this instance`);
      return false;
    }

    return this.providerRegistry.validateAddress(address, chainType);
  }

  // Utility methods
  async getDefaultChain(): Promise<ChainType> {
    // TODO: Multi-chain support - Return configured default instead of instance chain
    return this.currentChainType;
  }

  // TODO: Multi-chain support - Replace with proper multi-chain settings
  private async getCurrentChainSettings(): Promise<{
    detectedChain: ChainType;
    stellar: any;
    evm: any;
  }> {
    const settings = await this.settings.getByName('CHAIN_SETTINGS');
    const rawValue = settings?.value as any;

    // Detect chain type from current settings format
    let detectedChain: ChainType = 'stellar'; // default
    let evmConfig = null;
    let stellarConfig = null;

    if (rawValue && rawValue.rpcUrls) {
      // Current settings format detection
      const isEVMChain =
        rawValue.nativeCurrency?.symbol === 'ETH' || rawValue.id;
      detectedChain = isEVMChain ? 'evm' : 'stellar';

      if (isEVMChain) {
        evmConfig = {
          rpcUrl:
            rawValue.rpcUrls?.default?.http?.[0] ||
            'https://base-sepolia-rpc.publicnode.com',
          chainId: parseInt(rawValue.id) || 84532,
        };
      } else {
        stellarConfig = {
          rpcUrl:
            rawValue.rpcUrls?.default?.http?.[0] ||
            'https://stellar-soroban-public.nodies.app',
          networkPassphrase: 'Public Global Stellar Network ; September 2015',
        };
      }
    }

    return {
      detectedChain,
      stellar: stellarConfig || {
        rpcUrl: 'https://stellar-soroban-public.nodies.app',
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
      },
      evm: evmConfig || {
        rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
        chainId: 84532,
      },
    };
  }

  private async detectChainFromAddress(address: string): Promise<ChainType> {
    return this.providerRegistry.detectChainFromAddress(address);
  }

  // Backward compatibility methods (deprecated)
  /** @deprecated Use createWallet('stellar') instead */
  async createstellarWallets(): Promise<WalletKeys> {
    this.logger.warn(
      'createstellarWallets is deprecated. Use createWallet("stellar") instead.'
    );
    return this.createWallet('stellar');
  }

  /** @deprecated Use createWallet('evm') instead */
  async createethWallets(): Promise<WalletKeys> {
    this.logger.warn(
      'createethWallets is deprecated. Use createWallet("evm") instead.'
    );
    return this.createWallet('evm');
  }
}
