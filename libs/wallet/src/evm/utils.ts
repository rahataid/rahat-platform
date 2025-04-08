import { ethers } from "ethers";
import { EVM_TransactionWithURL } from "./types";

export async function getEVMTransaction(
    transactionParams: EVM_TransactionWithURL
): Promise<any> {
    const provider = new ethers.JsonRpcProvider(
        transactionParams.networkProvider
    );

    const contract = new ethers.Contract(
        transactionParams.contractAddress,
        transactionParams.abi,
        provider
    );

    if (!contract[transactionParams.functionName]?.populateTransaction) {
        throw new Error(
            `Function ${transactionParams.functionName} not found in ABI or is not callable.`
        );
    }

    const txnFunction = contract[transactionParams.functionName];
    if (!txnFunction || typeof txnFunction.populateTransaction !== 'function') {
        throw new Error(`Function ${transactionParams.functionName} is not callable.`);
    }

    let txn = await txnFunction.populateTransaction(
        ...transactionParams.args
    );

    const [feeData, estimatedGas] = await Promise.all([
        provider.getFeeData(),
        provider.estimateGas(txn),
    ]);

    return {
        ...txn,
        gasLimit:
            transactionParams?.options?.gasLimit ??
            BigInt(Number(estimatedGas) + 10000),
        maxFeePerGas:
            transactionParams?.options?.maxFeePerGas ?? feeData.maxFeePerGas,
        maxPriorityFeePerGas:
            transactionParams?.options?.maxPriorityFeePerGas ??
            feeData.maxPriorityFeePerGas,
    };
}