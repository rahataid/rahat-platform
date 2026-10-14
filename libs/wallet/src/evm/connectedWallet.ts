import { JsonRpcProvider, Wallet } from "ethers";
import { IConnectedWallet, WalletKeys } from "../types";
import {
    EVM_BroadcastedTransaction,
    EVM_CreateTransactionWithPk,
    EVM_SignedTransaction,
    EVM_UnsignedTransaction,
} from "./types";
import { getEVMTransaction } from "./utils";


export class ConnectedWallet implements IConnectedWallet<
    EVM_UnsignedTransaction,
    EVM_SignedTransaction,
    EVM_BroadcastedTransaction
> {

    blockchainType = "EVM";
    rpcUrl: string;
    currentWalletKeys: WalletKeys
    provider?: JsonRpcProvider;
    chainId?: bigint;

    constructor(walletKeys: WalletKeys, rpcUrl: string) {
        this.currentWalletKeys = walletKeys;
        this.rpcUrl = rpcUrl;
        this.provider = new JsonRpcProvider(rpcUrl);
    }

    async signMessage(message: string): Promise<string> {
        if (!this.currentWalletKeys) {
            throw new Error("No current account set for signing");
        }
        const wallet = new Wallet(this.currentWalletKeys.privateKey);
        return wallet.signMessage(message);
    }

    async signTransaction(
        transactionData: EVM_UnsignedTransaction
    ): Promise<EVM_SignedTransaction> {
        if (!this.currentWalletKeys || !this.provider) {
            throw new Error("No current account or provider set for signing transaction");
        }
        const wallet = new Wallet(this.currentWalletKeys.privateKey, this.provider);
        return wallet.signTransaction(transactionData);
    }

    async sendTransaction(
        rawTransaction: EVM_UnsignedTransaction
    ): Promise<EVM_BroadcastedTransaction> {
        if (!this.provider) {
            throw new Error("Provider is not initialized");
        }
        const signedTransaction = await this.signTransaction(rawTransaction);
        return this.provider.broadcastTransaction(signedTransaction);
    }

    getWalletKeys(): WalletKeys {
        return this.currentWalletKeys;
    }

    //TODO : cleanup this 
    async writeContract(
        transactionParams: EVM_CreateTransactionWithPk
    ): Promise<EVM_BroadcastedTransaction> {
        if (!this.provider) {
            throw new Error("Provider is not initialized");
        }
        const txn = await getEVMTransaction({
            ...transactionParams.txnParams,
            networkProvider: this.rpcUrl,
        });

        return this.sendTransaction(txn);
    }

}
