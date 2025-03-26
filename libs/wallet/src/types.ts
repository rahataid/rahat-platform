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

export interface IConnectedWallet {
    signMessage(message: string): Promise<string>;
    sendTransaction(rawTransaction: any): Promise<any>;
    getWalletKeys(): WalletKeys;
}

export interface IWalletManager {
    init(): Promise<void>;
    createWallet(): Promise<IConnectedWallet>;
    importWallet(privateKey: string): Promise<IConnectedWallet>;
    connect(walletAddress: string, blockchain: ChainType): Promise<IConnectedWallet>;
}

export type ChainType = 'stellar' | 'evm'
