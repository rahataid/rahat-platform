import { ChainType, WalletKeys, WalletStorage } from '@rahataid/wallet';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FileWalletStorage implements WalletStorage {
    private storageDir: string;

    constructor(storageDir = path.join(__dirname, 'wallet_storage')) {
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
        const filePath = path.join(this.storageDir, `${keys.blockchain.toLocaleUpperCase()}_${keys.address}.json`);
        await fs.writeFile(filePath, JSON.stringify(keys, null, 2));
    }
    async getKey(address: string, blockchain: ChainType): Promise<WalletKeys | null> {
        console.log(`Getting key for address: ${address.toLocaleUpperCase()} and blockchain: ${blockchain}`);
        const filePath = path.join(this.storageDir, `${blockchain.toLocaleUpperCase()}_${address}.json`);
        console.log(`Looking for file at path: ${filePath}`);
        // Log all files in storageDir for debugging
        try {
            const files = await fs.readdir(this.storageDir);
            console.log(`Files in ${this.storageDir}:`, files);
        } catch (error) {
            console.error('Error listing files in storage directory:', error);
        }
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            console.log('Successfully read wallet file');
            return JSON.parse(data) as WalletKeys;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                console.log('Wallet file not found');
                return null;
            }
            console.error('Error reading wallet file:', error);
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
