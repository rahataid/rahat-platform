import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RpcException } from '@nestjs/microservices';
import { BulkUpdateWallet, ChainType, IConnectedWallet, WalletKeys } from '@rahataid/wallet';
import { PrismaService } from '@rumsan/prisma';
import { BulkWalletAddressDto } from './dto/getBy.dto';
import {
  BLOCKCHAIN_REGISTRY_TOKEN,
  BlockchainProviderRegistry,
} from './providers/blockchain-provider.registry';

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

  constructor(
    private readonly prisma: PrismaService,
    @Inject(BLOCKCHAIN_REGISTRY_TOKEN)
    private readonly providerRegistry: BlockchainProviderRegistry
  ) { }

  async onModuleInit() {
    try {
      await this.initializeProviders();
    } catch (e) {
      this.logger.warn(`[WalletService] Wallet providers not initialized — waiting for settings. (${e.message})`);
    }
  }

  @OnEvent('settings.seeded')
  async handleSettingsSeeded() {
    this.logger.log('[WalletService] settings.seeded received. Re-initializing wallet providers...');
    try {
      await this.initializeProviders();
    } catch (e) {
      this.logger.error(`[WalletService] Failed to initialize after seed: ${e.message}`);
    }
  }

  private async initializeProviders() {
    this.logger.log('Initializing blockchain wallet managers...');

    const chainConfigs = await this.getChainSettingsFrom();

    this.logger.log(
      `Registered wallet classes: ${this.providerRegistry
        .getRegisteredChainTypes()
        .join(', ')}`
    );

    // Initialize all active chains from the database
    const initializedChains: ChainType[] = [];
    const errors: { chain: string; error: string }[] = [];

    for (const chain of chainConfigs) {
      try {
        const chainType = this.mapChainToChainType(chain);

        if (!this.providerRegistry.getRegisteredChainTypes().includes(chainType)) {
          this.logger.warn(`Chain type ${chainType} is not registered, skipping.`);
          continue;
        }

        const chainConfig = this.buildChainConfig(chain, chainType);

        await this.providerRegistry.initializeChain(chainType, chainConfig);
        initializedChains.push(chainType);
        this.logger.log(`Initialized wallet manager for chain: ${chain.name} (${chainType})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({ chain: chain.name, error: errorMsg });
        this.logger.error(`Failed to initialize chain ${chain.name}: ${errorMsg}`);
      }
    }

    if (initializedChains.length === 0 && errors.length > 0) {
      throw new RpcException({
        message: `Failed to initialize all chains: ${errors.map(e => `${e.chain} (${e.error})`).join(', ')}`,
        code: 'CHAIN_INITIALIZATION_FAILED',
      });
    }

    this.logger.log(
      `Initialized wallet managers: ${this.providerRegistry
        .getSupportedChains()
        .join(', ')}`
    );
  }

  private getChainSettingsFrom(): Promise<any[]> {
    return this.prisma.chainConfig.findMany({
      where: {
        isActive: true,
      },
    });
  }

  private mapChainToChainType(chain: any): ChainType {
    const chainLower = chain.chain?.toLowerCase();
    if (chainLower === 'evm' || chainLower === 'ethereum' || chainLower === 'base') {
      return 'evm';
    }
    if (chainLower === 'stellar' || chainLower === 'soroban') {
      return 'stellar';
    }

    // Default to evm for unknown chains
    this.logger.warn(`Unknown chain "${chain.chain}", defaulting to 'evm'`);
    return 'evm';
  }

  private buildChainConfig(chain: any, chainType: ChainType): any {
    const config: any = {
      rpcUrl: Array.isArray(chain.rpcUrl) ? chain.rpcUrl[0] : chain.rpcUrl,
    };

    if (chainType === 'evm') {
      config.chainId = chain.chainId ? parseInt(chain.chainId, 10) : 84532;
    } else if (chainType === 'stellar') {
      config.networkPassphrase = 'Test SDF Network ; September 2015';
    }

    return config;
  }

  async getDefaultChainFromDb(): Promise<ChainType> {
    const chains = await this.getChainSettingsFrom();

    // Find default chain (isDefault = true)
    const defaultChain = chains.find(c => c.isDefault);
    if (defaultChain) {
      return this.mapChainToChainType(defaultChain);
    }

    // Fallback to first active chain
    if (chains.length > 0) {
      return this.mapChainToChainType(chains[0]);
    }

    throw new RpcException({
      message: 'No active chains found in database',
      code: 'NO_ACTIVE_CHAINS',
    });
  }

  // Dynamic wallet creation based on chain type
  async createWallet(chainType?: ChainType): Promise<WalletKeys> {
    const chain = chainType || await this.getDefaultChainFromDb();

    this.logger.log(`Creating ${chain} wallet`);
    return this.providerRegistry.createWallet(chain);
  }

  // Multi-chain wallet creation
  async create(chains: ChainType[]): Promise<WalletCreateResult[]> {
    this.logger.log(`Creating wallets for chains: ${chains.join(', ')}`);

    const supportedChains = chains.filter((chain) =>
      this.providerRegistry.getSupportedChains().includes(chain)
    );

    if (supportedChains.length === 0) {
      this.logger.warn(
        `No supported chains found in request: ${chains.join(', ')}`
      );
      supportedChains.push(await this.getDefaultChainFromDb());
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
  async createBulk(count: number): Promise<WalletCreateResult[]> {
    const chainType = await this.getDefaultChainFromDb();

    if (!this.providerRegistry.getSupportedChains().includes(chainType)) {
      throw new RpcException({
        message: `Chain ${chainType} is not supported in this instance`,
        code: 'CHAIN_NOT_SUPPORTED_IN_INSTANCE',
        params: { chainType },
      });
    }

    const wallets = await this.providerRegistry.createBulk(count, chainType);

    return wallets.map((wallet) => ({
      chain: chainType,
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
      throw new RpcException({
        message: 'Wallet address not found',
        code: 'WALLET_ADDRESS_NOT_FOUND',
      });
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

  async getBulkSecretByWallet(accounts: BulkWalletAddressDto) {
    this.logger.log(`Getting bulk secrets for wallets: ${accounts.walletAddresses.length} addresses on chain ${accounts.chain}`);
    return Promise.all(accounts.walletAddresses.map(async (walletAddress) => {
      return this.getSecretByWallet(walletAddress, accounts.chain);
    }))
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
    const result = await this.prisma.beneficiaryPii.findFirst({
      where: { phone: phoneNumber },
      select: {
        beneficiary: {
          select: { walletAddress: true },
        },
      },
    });

    if (!result) {
      throw new RpcException({
        message: 'Beneficiary not found',
        code: 'BENEFICIARY_NOT_FOUND',
      });
    }

    return result.beneficiary.walletAddress;
  }

  async updateBulk(bulkUpdateWalletDto: BulkUpdateWallet) {
    return Promise.all(bulkUpdateWalletDto.benUuids.map(async (uuid) => {
      const walletAddress = await this.create([bulkUpdateWalletDto.chain]);
      const beneficiary = await this.prisma.beneficiary.update({
        where: { uuid },
        data: { walletAddress: walletAddress[0].address },
      });
      return { uuid, walletAddress: beneficiary.walletAddress, secret: walletAddress[0].privateKey };
    }))
  }

  // Connect to existing wallet
  async connectWallet(
    address: string,
    chain?: ChainType
  ): Promise<IConnectedWallet> {
    const chainType = chain || (await this.detectChainFromAddress(address));

    if (!this.providerRegistry.getSupportedChains().includes(chainType)) {
      throw new RpcException({
        message: `Chain ${chainType} not supported in this instance`,
        code: 'CHAIN_NOT_SUPPORTED_IN_INSTANCE',
        params: { chainType },
      });
    }

    return this.providerRegistry.connectWallet(address, chainType);
  }

  // Import wallet from private key
  async importWallet(
    privateKey: string,
    chain?: ChainType
  ): Promise<WalletKeys> {
    const chainType = chain || await this.getDefaultChainFromDb();

    if (!this.providerRegistry.getSupportedChains().includes(chainType)) {
      throw new RpcException({
        message: `Chain ${chainType} not supported in this instance`,
        code: 'CHAIN_NOT_SUPPORTED_IN_INSTANCE',
        params: { chainType },
      });
    }

    return this.providerRegistry.importWallet(privateKey, chainType);
  }

  // Validation methods
  async validateAddress(address: string, chain?: ChainType): Promise<boolean> {
    const chainType = chain || (await this.detectChainFromAddress(address));

    if (!this.providerRegistry.getSupportedChains().includes(chainType)) {
      this.logger.warn(`Chain ${chainType} not supported in this instance`);
      return false;
    }

    return this.providerRegistry.validateAddress(address, chainType);
  }

  async getDefaultChain(): Promise<ChainType> {
    return this.getDefaultChainFromDb();
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
