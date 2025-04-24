import { ethers } from "ethers";
import { Keypair } from 'stellar-sdk';
import { MemoryWalletStorage } from "../storages/memory.storage";
import { ChainType, IWalletManager, WalletStorage } from "../types";
import { ConnectedWallet } from "./connectedWallet";


export class StellarWallet implements IWalletManager {
    blockchainType = "STELLAR";
    rpcUrl: string;
    storage: WalletStorage

    constructor(rpcUrl: string, storage?: WalletStorage) {
        this.rpcUrl = rpcUrl
        this.storage = storage || new MemoryWalletStorage()
    }

    async init() {
        await this.storage.init();
    }

    async connect(walletAddess: string, blockchain: ChainType): Promise<ConnectedWallet> {
        const keys = await this.storage.getKey(walletAddess, blockchain);
        if (!keys) throw new Error('Wallet not found')
        const newWalletInstance = new ConnectedWallet(keys, this.rpcUrl);
        return newWalletInstance;
    }

    async createWallet(): Promise<ConnectedWallet> {
        const mnemonic = ethers.Mnemonic.fromEntropy(ethers.randomBytes(16));
        const hdPath = "m/44'/148'/0'/0/0";
        const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, hdPath);
        const privateKeyHex = wallet.privateKey.slice(2);
        const privateKeyBuffer = Buffer.from(privateKeyHex, "hex");
        const stellarKeypair = Keypair.fromRawEd25519Seed(privateKeyBuffer);
        const walletKeys = {
            address: stellarKeypair.publicKey(),
            privateKey: stellarKeypair.secret(),
            publicKey: stellarKeypair.publicKey(),
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