import { BASE_FEE, Keypair, Networks, TransactionBuilder } from 'stellar-sdk';
import { IConnectedWallet, WalletKeys } from "../types.js";


export class ConnectedWallet implements IConnectedWallet {
    blockchainType = "STELLAR";
    rpcUrl: string;
    currentWalletKeys?: WalletKeys

    constructor(walletKeys: WalletKeys, rpcUrl: string) {
        this.currentWalletKeys = walletKeys;
        this.rpcUrl = rpcUrl;
    }
    async signMessage(message: string): Promise<string> {
        if (!this.currentWalletKeys) {
            throw new Error("No current account set for signing");
        }
        const keypair = Keypair.fromSecret(this.currentWalletKeys.privateKey)
        const messageBuffer = Buffer.from(message, "utf8");
        const signature = keypair.sign(messageBuffer);
        return signature.toString("base64")
    }


    //TODO: Desine transaction type
    async signTransaction(transactionData: any): Promise<any> {

        if (!this.currentWalletKeys) {
            throw new Error("No current account set for signing");
        }
        const keypair = Keypair.fromSecret(this.currentWalletKeys.privateKey);
        const transaction = new TransactionBuilder(transactionData, {
            fee: BASE_FEE,
            networkPassphrase: Networks.PUBLIC // or Networks.TESTNET for testnet
        })
            .setTimeout(30)
            .build();

        return transaction.sign(keypair);
    }

    //TDOD: implement Send transactions
    async sendTransaction(transactionData: any): Promise<any> {

        if (!this.currentWalletKeys) {
            throw new Error("No current account set for signing");
        }
        const keypair = Keypair.fromSecret(this.currentWalletKeys.privateKey);
        const transaction = new TransactionBuilder(transactionData, {
            fee: BASE_FEE,
            networkPassphrase: Networks.PUBLIC // or Networks.TESTNET for testnet
        })
            .setTimeout(30)
            .build();

        return transaction.sign(keypair);
    }

    getWalletKeys(): WalletKeys {
        if (!this.currentWalletKeys) {
            throw new Error("No current wallet to export");
        }
        return this.currentWalletKeys;
    }
}