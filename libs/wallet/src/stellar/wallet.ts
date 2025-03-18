import { ethers } from "ethers";
import { Keypair } from 'stellar-sdk';
import { IWalletManager, WalletStorage } from "../types.js";
import { ConnectedWallet } from "./connectedWallet.js";

export class StellarWallet implements IWalletManager {
    blockchainType = "STELLAR";
    rpcUrl: string;
    storage: WalletStorage

    constructor(rpcUrl: string, storage: WalletStorage) {
        this.rpcUrl = rpcUrl
        this.storage = storage
    }

    async init() {
        await this.storage.init();
    }

    async connect(walletAddess: string): Promise<ConnectedWallet> {
        const keys = await this.storage.getKey(walletAddess);
        if (!keys) throw new Error('Wallet not found')
        const newWalletInstance = new ConnectedWallet(keys, this.rpcUrl);
        return newWalletInstance;
    }

    async createWallet(): Promise<ConnectedWallet> {
        const mnemonic = ethers.Mnemonic.fromEntropy(ethers.randomBytes(16));
        const hdPath = "m/44'/148'/0'/0/0";
        const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, hdPath);
        const walletKeys = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
            mnemonic: wallet.mnemonic?.phrase,
            blockchain: this.blockchainType
        }
        await this.storage.saveKey(walletKeys)
        return new ConnectedWallet(walletKeys, this.rpcUrl);
    }

    async importWallet(privateKey: string): Promise<ConnectedWallet> {
        const keypair = Keypair.fromSecret(privateKey)
        const walletKeys = {
            address: keypair.publicKey(),
            privateKey: keypair.secret(),
            blockchain: this.blockchainType
        }
        return new ConnectedWallet(walletKeys, this.rpcUrl);
    }

}