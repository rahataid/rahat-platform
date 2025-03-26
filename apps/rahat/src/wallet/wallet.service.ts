import { Injectable } from '@nestjs/common';
import { ChainType, EVMWallet, StellarWallet, WalletKeys } from '@rahataid/wallet';
import { PrismaService } from '@rumsan/prisma';
import { FileWalletStorage } from './storages/fs.storage';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) { }

  async create(chains: ChainType[]) {
    const chainWallets = await Promise.all(
      chains.map(async (chain: ChainType) => {
        const functionName = `create${chain}Wallets` as keyof this;

        // Verify method exists and assert it as a function
        if (typeof this[functionName] !== 'function') {
          throw new Error(`Wallet creation method not found`);
        }

        // Type assertion for the function
        const walletFn = this[functionName] as () => Promise<WalletKeys>;
        const wallet = await walletFn();

        return {
          chain,
          address: wallet.address,
          privateKey: wallet.privateKey,
        };
      })
    );
    console.log(chainWallets);
    return chainWallets;
  }

  signAndSend() {
    return `This action returns all wallet`;
  }

  async createevmWallets() {
    // const settings = new SettingsService(this.prisma);
    // const evmChain = await settings.getByName("CHAIN_SETTINGS");
    //@ts-ignore
    const rpcURL = "http://127.0.0.1:8888";

    const evmWallet = new EVMWallet(rpcURL, new FileWalletStorage());
    await evmWallet.init(); // init returns a promise
    const walletKeys = (await evmWallet.createWallet()).getWalletKeys();
    return walletKeys;
  }

  async createstellarWallets() {
    const stellarWallet = new StellarWallet("https://horizon-testnet.stellar.org", new FileWalletStorage());
    await stellarWallet.init(); // init returns a promise
    const walletKeys = (await stellarWallet.createWallet()).getWalletKeys();
    return walletKeys;
  }
}