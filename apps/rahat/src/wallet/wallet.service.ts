import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BulkCreateWallet, BulkUpdateWallet, ChainType, EVMWallet, StellarWallet, WalletKeys } from '@rahataid/wallet';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { FileWalletStorage } from './storages/fs.storage';

@Injectable()
export class WalletService implements OnModuleInit {
  private readonly logger = new Logger(WalletService.name);
  private evmWallet: EVMWallet | null = null; // Singleton instance for EVMWallet
  private stellarWallet: StellarWallet | null = null; // Singleton instance for StellarWallet

  constructor(private readonly settings: SettingsService, private readonly prisma: PrismaService) { }

  // Called when the module is initialized
  async onModuleInit() {
    await this.initializeEvmWallet();
    await this.initializeStellarWallet();
  }

  // Initialize EVMWallet
  private async initializeEvmWallet() {
    this.logger.log('Initializing EVMWallet...');
    const evmChain = await this.settings.getByName('CHAIN_SETTINGS');
    const evmChainValue = evmChain?.value as { rpcUrls: { default: { http: string[] } } } || {
      rpcUrls: { default: { http: ['https://base-sepolia-rpc.publicnode.com'] } },
    };

    this.evmWallet = new EVMWallet(
      evmChainValue.rpcUrls.default.http[0],
      new FileWalletStorage()
    );
    await this.evmWallet.init(); // Initialize the wallet
  }

  // Initialize StellarWallet
  private async initializeStellarWallet() {
    this.logger.log('Initializing StellarWallet...');
    const stellarChain = await this.settings.getByName('CHAIN_SETTINGS');
    const stellarChainValue = stellarChain?.value as { rpcUrls: { default: { http: string } } } || {
      rpcUrls: { default: { http: 'https://stellar-soroban-public.nodies.app' } },
    };

    this.stellarWallet = new StellarWallet(
      stellarChainValue.rpcUrls.default.http,
      new FileWalletStorage()
    );
    await this.stellarWallet.init(); // Initialize the wallet
  }

  private getEvmWallet(): EVMWallet {
    if (!this.evmWallet) {
      throw new Error('EVMWallet is not initialized');
    }
    return this.evmWallet;
  }

  private getStellarWallet(): StellarWallet {
    if (!this.stellarWallet) {
      throw new Error('StellarWallet is not initialized');
    }
    return this.stellarWallet;
  }

  async createethWallets(): Promise<WalletKeys> {
    const evmWallet = this.getEvmWallet();
    const walletKeys = (await evmWallet.createWallet()).getWalletKeys();
    return walletKeys;
  }

  async createstellarWallets() {
    const stellarWallet = this.getStellarWallet();
    const walletKeys = (await stellarWallet.createWallet()).getWalletKeys();
    return walletKeys;
  }

  async create(chains: ChainType[]) {
    const chainWallets = await Promise.all(
      chains.map(async (chain: ChainType) => {
        const functionName = this.getFunctionByName(chain);
        const walletFn = this[functionName].bind(this) as () => Promise<WalletKeys>;
        const wallet = await walletFn();

        return {
          chain,
          address: wallet.address,
          privateKey: wallet.privateKey,
        };
      })
    );
    return chainWallets;
  }

  async createBulk(chains: BulkCreateWallet) {

    // Initialize walletAddresses as an array
    const walletPromises = [];

    // Create array of promises for wallet creation
    for (let i = 0; i < chains.count; i++) {
      const functionName = this.getFunctionByName(chains.chain);
      const walletFn = this[functionName].bind(this) as () => Promise<WalletKeys>;
      walletPromises.push(walletFn());
    }

    // Wait for all wallets to be created
    const wallets = await Promise.all(walletPromises);

    // Map wallets to desired output format
    const walletAddresses = wallets.map(wallet => ({
      chain: chains.chain,
      address: wallet.address,
      privateKey: wallet.privateKey,
    }));

    return walletAddresses;
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

  async getWalletByPhone(phoneNumber: string) {
    const result = await this.prisma.beneficiaryPii.findUnique({
      where: { phone: phoneNumber },
      select: {
        beneficiary: {
          select: { walletAddress: true },
        },
      },
    });

    if (!result) {
      throw new Error("Beneficiary not found");
    }

    return result.beneficiary.walletAddress;
  }

  async getSecretByWallet(walletAddress: string, chain: ChainType) {

    if (!walletAddress) {
      throw new Error("Wallet address not found");
    }
    const storage = new FileWalletStorage();

    this.logger.log(`Storage: ${JSON.stringify(storage)}`);
    return storage.getKey(walletAddress, chain);
  }

  async getSecretByPhone(phoneNumber: string, chain: ChainType) {
    this.logger.log(`Getting secret by phone number: ${phoneNumber} and chain: ${chain}`);

    const walletAddress = await this.getWalletByPhone(phoneNumber);
    this.logger.log(`Wallet address: ${walletAddress}`);

    return this.getSecretByWallet(walletAddress, chain);
  }


  getFunctionByName(chain: string): string {
    const functionName = `create${chain}Wallets` as keyof this;

    if (typeof this[functionName] !== 'function') {
      throw new Error(`Wallet creation method not found`);
    }

    return functionName as string;
  }
}