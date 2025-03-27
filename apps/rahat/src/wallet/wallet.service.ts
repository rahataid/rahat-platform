import { Injectable } from '@nestjs/common';
import { ChainType, EVMWallet, StellarWallet, WalletKeys } from '@rahataid/wallet';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { FileWalletStorage } from './storages/fs.storage';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) { }

  // Right now this only work for 1 chain, need to modify logic of chain settings to include both
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

  signAndSend() {
    return `This action returns all wallet`;
  }

  // Utilities
  async createethWallets() {
    const settings = new SettingsService(this.prisma);
    const evmChain = await settings.getByName("CHAIN_SETTINGS");
    const evmWallet = new EVMWallet(evmChain.value.rpcUrls.default.http[0] as string, new FileWalletStorage());
    await evmWallet.init();
    const walletKeys = (await evmWallet.createWallet()).getWalletKeys();
    return walletKeys;
  }

  async createstellarWallets() {
    const settings = new SettingsService(this.prisma);
    const stellarChain = await settings.getByName("CHAIN_SETTINGS");
    const stellarWallet = new StellarWallet(stellarChain.value.rpcUrls.default.http as string, new FileWalletStorage());
    await stellarWallet.init();
    const walletKeys = (await stellarWallet.createWallet()).getWalletKeys();
    return walletKeys;
  }

  getFunctionByName(chain: string): string {
    const functionName = `create${chain}Wallets` as keyof this;

    if (typeof this[functionName] !== 'function') {
      throw new Error(`Wallet creation method not found`);
    }

    return functionName as string;
  }
}