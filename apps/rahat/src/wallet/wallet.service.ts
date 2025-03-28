import { Injectable } from '@nestjs/common';
import { ChainType, EVMWallet, StellarWallet, WalletKeys } from '@rahataid/wallet';
import { SettingsService } from '@rumsan/extensions/settings';
import { FileWalletStorage } from './storages/fs.storage';

@Injectable()
export class WalletService {
  constructor(
    private readonly settings: SettingsService
  ) { }

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
  // THESE NEEDS TO BE OPTIMIZED, cant init() everytime
  async createethWallets() {
    const evmChain = await this.settings.getByName("CHAIN_SETTINGS");
    const evmChainValue = evmChain.value as { rpcUrls: { default: { http: string[] } } };
    const evmWallet = new EVMWallet(evmChainValue.rpcUrls.default.http[0] || 'https://base-sepolia-rpc.publicnode.com', new FileWalletStorage());
    await evmWallet.init();
    const walletKeys = (await evmWallet.createWallet()).getWalletKeys();
    return walletKeys;
  }

  async createstellarWallets() {
    const stellarChain = await this.settings.getByName("CHAIN_SETTINGS");
    const stellarChainValue = stellarChain.value as { rpcUrls: { default: { http: string } } };
    const stellarWallet = new StellarWallet(stellarChainValue.rpcUrls.default.http || 'https://stellar-soroban-public.nodies.app', new FileWalletStorage());
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