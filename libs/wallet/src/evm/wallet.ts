import { ethers } from 'ethers';
import {
  ChainType,
  IConnectedWallet,
  IWalletManager,
  WalletStorage,
} from '../types';
import { ConnectedWallet } from './connectedWallet';
import { MemoryWalletStorage } from '../storages/memory.storage';

export class EVMWallet implements IWalletManager {
  static blockchainType = 'EVM';
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
