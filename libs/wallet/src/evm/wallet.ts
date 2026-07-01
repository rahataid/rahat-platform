import { ethers } from 'ethers';
import {
  ChainType,
  IConnectedWallet,
  IWalletManager,
  WalletKeys,
  WalletStorage,
} from '../types';
import { ConnectedWallet } from './connectedWallet';
import { MemoryWalletStorage } from '../storages/memory.storage';

export class EVMWallet implements IWalletManager {
  static blockchainType = 'EVM';
  readonly requiresFunding = true;
  rpcUrl: string;
  storage: WalletStorage;
  provider?: ethers.Provider;
  chainId?: bigint;

  constructor(rpcUrl: string, storage?: WalletStorage) {
    this.rpcUrl = rpcUrl;
    this.storage = storage || new MemoryWalletStorage();
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  async init() {
    await this.storage.init();
    const network = await this.provider?.getNetwork();
    if (!network) throw new Error("Couldn't get ChainId");
    this.chainId = network.chainId;
  }

  async connect(
    walletAddress: string,
    blockchain: ChainType
  ): Promise<IConnectedWallet> {
    const keys = await this.storage.getKey(walletAddress, blockchain);
    if (!keys) throw new Error('Wallet not found');
    const newWalletInstance = new ConnectedWallet(keys, this.rpcUrl);
    return newWalletInstance;
  }

  async createWallet(): Promise<IConnectedWallet> {
    const wallet = ethers.Wallet.createRandom();
    const walletKeys = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      mnemonic: wallet.mnemonic?.phrase,
      blockchain: EVMWallet.blockchainType,
    };
    await this.storage.saveKey(walletKeys);
    return new ConnectedWallet(walletKeys, this.rpcUrl);
  }

  async createBulk(count: number): Promise<WalletKeys[]> {
    const wallets: WalletKeys[] = [];

    // Generate all wallets (CPU-bound, but fast)
    for (let i = 0; i < count; i++) {
      const wallet = ethers.Wallet.createRandom();
      wallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        mnemonic: wallet.mnemonic?.phrase,
        blockchain: EVMWallet.blockchainType,
      });
    }

    // Batch save to storage (I/O-bound, optimized)
    if (this.storage.saveBulk) {
      await this.storage.saveBulk(wallets);
    } else {
      // Fallback to individual saves
      await Promise.all(wallets.map(w => this.storage.saveKey(w)));
    }

    return wallets;
  }

  async fundWallet(address: string, deployerKey: string): Promise<void> {
    const signer = new ethers.Wallet(deployerKey, this.provider);
    const tx = await signer.sendTransaction({ to: address, value: ethers.parseEther('0.01') });
    await tx.wait();
  }

  async importWallet(privateKey: string): Promise<ConnectedWallet> {
    const wallet = new ethers.Wallet(privateKey);
    const walletKeys = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.signingKey.compressedPublicKey,
      blockchain: EVMWallet.blockchainType,
    };
    await this.storage.saveKey(walletKeys);
    return new ConnectedWallet(walletKeys, this.rpcUrl);
  }
}

export default EVMWallet;
