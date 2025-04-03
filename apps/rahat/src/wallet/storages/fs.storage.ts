import { ChainType, WalletKeys, WalletStorage } from '@rahataid/wallet';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FileWalletStorage implements WalletStorage {
    private storageDir: string;

    constructor(storageDir = './wallet_storage') {
        this.storageDir = storageDir;
    }

    async init() {
        const dirExists = await fs.stat(this.storageDir).then(() => true).catch(() => false);
        if (!dirExists) {
            console.log("Making new directory");
            await fs.mkdir(this.storageDir, { recursive: true });
        }
    }

    async saveKey(keys: WalletKeys) {
        const filePath = path.join(this.storageDir, `${keys.blockchain}_${keys.address}.json`);
        await fs.writeFile(filePath, JSON.stringify(keys, null, 2));
    }

    async getKey(address: string, blockchain: ChainType): Promise<WalletKeys | null> {
        const filePath = path.join(this.storageDir, `${blockchain}_${address}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data) as WalletKeys;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async isInitialized() {
        try {
            const dirExists = await fs.stat(this.storageDir).then(() => true).catch(() => false);
            return dirExists;
        } catch (error) {
            console.error('Error checking if storage directory is initialized:', error);
            return false;
        }
    }
}
