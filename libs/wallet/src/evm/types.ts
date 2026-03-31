import {
    AddressLike,
    ContractTransaction,
    ethers,
    Interface,
    InterfaceAbi,
} from "ethers";

export type ABI = Interface | InterfaceAbi;

export type ARGS = string | number | bigint | boolean | ethers.BytesLike;

export type EVM_Transaction = {
    abi: ABI;
    contractAddress: `0x${string}`;
    functionName: string;
    args: ARGS[];
    senderAddress?: AddressLike;
    options?: EVM_TransactionOptions;
};

export type EVM_CreateTransactionWithPk = {
    txnParams: EVM_Transaction;
    privateKey: `0x${string}`;
};

export type EVM_TransactionWithURL = EVM_Transaction & {
    networkProvider: string;
};

export type EVM_TransactionToSign = {
    txn: ContractTransaction;
    privateKey: `0x${string}`;
};

export type EVM_TransactionToSignWithURL = EVM_TransactionToSign & {
    networkProvider: string;
};

export type EVM_TransactionToSend = {
    signedTxn: string;
};

export type EVM_TransactionToSendWithURL = EVM_TransactionToSend & {
    networkProvider: string;
};

export type EVM_TransactionOptions = {
    gasPrice?: number;
    gasLimit?: number;
    value?: number;
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
};
