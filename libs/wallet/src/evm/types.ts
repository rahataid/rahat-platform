import {
    AddressLike,
    BigNumberish,
    ethers,
    Interface,
    InterfaceAbi,
    TransactionRequest,
    TransactionResponse,
} from "ethers";

export type ABI = Interface | InterfaceAbi;

export type ARGS = string | number | bigint | boolean | ethers.BytesLike;

/**
 * Normalized EVM transaction request used before signing or broadcasting.
 */
export type EVM_UnsignedTransaction = TransactionRequest;

/**
 * Serialized raw transaction returned by ethers wallets after signing.
 */
export type EVM_SignedTransaction = string;

/**
 * Transaction response returned after a signed payload is broadcast.
 */
export type EVM_BroadcastedTransaction = TransactionResponse;

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
    txn: EVM_UnsignedTransaction;
    privateKey: `0x${string}`;
};

export type EVM_TransactionToSignWithURL = EVM_TransactionToSign & {
    networkProvider: string;
};

export type EVM_TransactionToSend = {
    signedTxn: EVM_SignedTransaction;
};

export type EVM_TransactionToSendWithURL = EVM_TransactionToSend & {
    networkProvider: string;
};

export type EVM_TransactionOptions = {
    gasPrice?: BigNumberish;
    gasLimit?: BigNumberish;
    value?: BigNumberish;
    maxFeePerGas?: BigNumberish;
    maxPriorityFeePerGas?: BigNumberish;
};
