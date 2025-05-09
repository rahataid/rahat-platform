import { ChainType, WalletKeys, WalletStorage } from '../types';

export class MemoryWalletStorage implements WalletStorage {
    private storage: Map<string, WalletKeys>;

    constructor() {
        this.storage = new Map();
    }

    async init() {
        console.warn("USING IN-MEMORY WALLET STORAGE. DATA WILL NOT PERSIST")
        return;
    }

    async saveKey(keys: WalletKeys) {
        console.warn("USING IN-MEMORY WALLET STORAGE. DATA WILL NOT PERSIST")
        const key = `${keys.blockchain}_${keys.address}`;
        this.storage.set(key, keys);
    }

    async getKey(address: string, blockchain: ChainType): Promise<WalletKeys | null> {
        console.warn("USING IN-MEMORY WALLET STORAGE. DATA WILL NOT PERSIST")
        const key = `${blockchain}_${address}`;
        const keys = this.storage.get(key);
        return keys || null;
    }

    async isInitialized() {
        return true;
    }
}
