// export enum BlockchainType {
//     EVM = "evm",
//     STELLAR = "stellar",
// }

export interface WalletConfig {
  rpcUrl: string;
  storage: WalletStorage;
  encryptionKey?: Uint8Array; // Optional for encryption
}

export interface WalletStorage {
  init(): Promise<void>; //initialize the storage connection
  saveKey(key: WalletKeys): Promise<void>;
  getKey(address: string, blockchain: string): Promise<WalletKeys | null>;
  deleteWallet?(address: string): Promise<void>; // rethink?
}

// Is Mnemonic Required?
export interface WalletKeys {
  address: string;
  privateKey: string;
  publicKey?: string;
  blockchain: string;
  mnemonic?: string; // Optional - Only if you want to support exports to external wallets and recovery
}

/**
 * Standard transaction contract shared by connected wallet implementations.
 * Each chain can specialize the request, signed payload, and send result types.
 */
export interface IConnectedWallet<
  TUnsignedTransaction = unknown,
  TSignedTransaction = unknown,
  TSendResult = TSignedTransaction,
> {
  signMessage(message: string): Promise<string>;
  signTransaction(transaction: TUnsignedTransaction): Promise<TSignedTransaction>;
  sendTransaction(transaction: TUnsignedTransaction): Promise<TSendResult>;
  getWalletKeys(): WalletKeys;
}

export interface IWalletManager<
  TConnectedWallet extends IConnectedWallet = IConnectedWallet,
> {
  init(): Promise<void>;
  createWallet(): Promise<TConnectedWallet>;
  importWallet(privateKey: string): Promise<TConnectedWallet>;
  connect(
    walletAddress: string,
    blockchain: ChainType
  ): Promise<TConnectedWallet>;
}

export type ChainType = 'stellar' | 'evm';

export type BulkCreateWallet = {
  chain?: ChainType;
  count: number;
};

export type BulkUpdateWallet = {
  chain: ChainType;
  benUuids: string[];
}
