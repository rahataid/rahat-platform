import { JsonRpcProvider, Provider, Wallet } from "ethers";
import { IConnectedWallet, WalletKeys } from "../types";
import { EVM_CreateTransactionWithPk } from "./types";
import { getEVMTransaction } from "./utils";


export class ConnectedWallet implements IConnectedWallet {

    blockchainType = "EVM";
    rpcUrl: string;
    currentWalletKeys: WalletKeys
    provider?: Provider;
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

    //TODO define transaction type
    async signTransaction(transactionData: any): Promise<any> {
        if (!this.currentWalletKeys || !this.provider) {
            throw new Error("No current account or provider set for signing transaction");
        }
        const wallet = new Wallet(this.currentWalletKeys.privateKey, this.provider);
        return wallet.signTransaction(transactionData);
    }

    async sendTransaction(rawTransaction: any): Promise<any> {
        if (!this.provider) {
            throw new Error("Provider is not initialized");
        }
        const signedTransaction = await this.signTransaction(rawTransaction);
        if (!this.provider.sendTransaction) {
            throw new Error("Provider's sendTransaction method is not available");
        }
        return await this.provider.sendTransaction(signedTransaction);
    }

    getWalletKeys(): WalletKeys {
        return this.currentWalletKeys;
    }

    //TODO : cleanup this 
    async writeContract(transactionParams: EVM_CreateTransactionWithPk) {
        if (!this.provider) {
            throw new Error("Provider is not initialized");
        }
        const txn = await getEVMTransaction({
            ...transactionParams.txnParams,
            networkProvider: this.rpcUrl,
        });

        const signedTxn = await this.signTransaction(txn)

        this.sendTransaction(signedTxn);
    }

}
