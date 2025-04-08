import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChainType, EVMWallet, StellarWallet, WalletKeys } from '@rahataid/wallet';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { FileWalletStorage } from './storages/fs.storage';

@Injectable()
export class WalletService implements OnModuleInit {
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
    const evmChain = await this.settings.getByName('CHAIN_SETTINGS');
    const evmChainValue = evmChain.value as { rpcUrls: { default: { http: string[] } } };
    this.evmWallet = new EVMWallet(
      evmChainValue.rpcUrls.default.http[0] || 'https://base-sepolia-rpc.publicnode.com',
      new FileWalletStorage()
    );
    await this.evmWallet.init(); // Initialize the wallet
  }

  // Initialize StellarWallet
  private async initializeStellarWallet() {
    const stellarChain = await this.settings.getByName('CHAIN_SETTINGS');
    const stellarChainValue = stellarChain.value as { rpcUrls: { default: { http: string } } };
    this.stellarWallet = new StellarWallet(
      stellarChainValue.rpcUrls.default.http || 'https://stellar-soroban-public.nodies.app',
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
    return storage.getKey(walletAddress, chain);
  }


  getFunctionByName(chain: string): string {
    const functionName = `create${chain}Wallets` as keyof this;

    if (typeof this[functionName] !== 'function') {
      throw new Error(`Wallet creation method not found`);
    }

    return functionName as string;
  }
}