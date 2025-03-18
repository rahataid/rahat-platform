import { WalletKeys, WalletStorage } from '@rahataid/wallet';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FileWalletStorage implements WalletStorage {
    private storageDir: string;

    constructor(storageDir: string = './wallet_storage') {
        this.storageDir = storageDir;
    }

    async init() {
        console.log("Making new directory")
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
        } catch (error) {
            console.error('Error creating storage directory:', error);
        }
    }

    async saveKey(keys: WalletKeys) {
        const filePath = path.join(this.storageDir, `wallet_${keys.address}.json`);
        await fs.writeFile(filePath, JSON.stringify(keys, null, 2));
    }

    async getKey(address: string): Promise<WalletKeys | null> {
        const filePath = path.join(this.storageDir, `wallet_${address}.json`);
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
            await fs.readdir(this.storageDir);
            return true;
        } catch (error) {
            return false;
        }
    }
}
