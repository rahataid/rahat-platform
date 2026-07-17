import { BASE_FEE, Keypair, TransactionBuilder } from 'stellar-sdk';
import { IConnectedWallet, WalletKeys } from "../types.js";
import {
    DEFAULT_STELLAR_NETWORK_PASSPHRASE,
    DEFAULT_STELLAR_TRANSACTION_TIMEOUT,
    StellarSignedTransaction,
    StellarTransactionRequest,
} from './types.js';


export class ConnectedWallet implements IConnectedWallet<StellarTransactionRequest, StellarSignedTransaction> {
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


    async signTransaction(transactionRequest: StellarTransactionRequest): Promise<StellarSignedTransaction> {

        if (!this.currentWalletKeys) {
            throw new Error("No current account set for signing");
        }
        const keypair = Keypair.fromSecret(this.currentWalletKeys.privateKey);
        const transaction = new TransactionBuilder(transactionRequest.sourceAccount, {
            fee: transactionRequest.fee ?? BASE_FEE,
            networkPassphrase:
                transactionRequest.networkPassphrase ??
                DEFAULT_STELLAR_NETWORK_PASSPHRASE,
        })
            .setTimeout(
                transactionRequest.timeoutSeconds ??
                DEFAULT_STELLAR_TRANSACTION_TIMEOUT
            )
            .build();

        transaction.sign(keypair);
        return transaction;
    }

    async sendTransaction(
        transactionRequest: StellarTransactionRequest
    ): Promise<StellarSignedTransaction> {
        return this.signTransaction(transactionRequest);
    }

    getWalletKeys(): WalletKeys {
        if (!this.currentWalletKeys) {
            throw new Error("No current wallet to export");
        }
        return this.currentWalletKeys;
    }
}
