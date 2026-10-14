import { Networks, Transaction } from 'stellar-sdk';

/**
 * Minimal Stellar source-account shape accepted by TransactionBuilder.
 * This keeps the wallet compatible with both `Account` and Horizon account responses.
 */
export interface StellarTransactionSourceAccount {
  accountId(): string;
  sequenceNumber(): string;
  incrementSequenceNumber(): void;
}

/**
 * Structured input for building and signing a Stellar transaction envelope.
 */
export interface StellarTransactionRequest {
  sourceAccount: StellarTransactionSourceAccount;
  fee?: string;
  networkPassphrase?: string;
  timeoutSeconds?: number;
}

/**
 * Stellar currently returns the signed envelope so callers can submit it upstream.
 */
export type StellarSignedTransaction = Transaction;

export const DEFAULT_STELLAR_NETWORK_PASSPHRASE = Networks.PUBLIC;
export const DEFAULT_STELLAR_TRANSACTION_TIMEOUT = 30;
