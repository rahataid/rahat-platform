import { Logger } from '@nestjs/common';
import { ChainType, WalletKeys, WalletStorage } from '@rahataid/wallet';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FileWalletStorage implements WalletStorage {
    private storageDir: string;
    private readonly logger = new Logger(FileWalletStorage.name);

    constructor(storageDir = path.join(__dirname, 'wallet_storage')) {
        this.storageDir = storageDir;
    }

    async init() {
        const dirExists = await fs.stat(this.storageDir).then(() => true).catch(() => false);
        if (!dirExists) {
            this.logger.log("Making new directory");
            await fs.mkdir(this.storageDir, { recursive: true });
        }
    }

    async saveKey(keys: WalletKeys) {
        const filePath = path.join(this.storageDir, `${keys.blockchain.toLocaleUpperCase()}_${keys.address}.json`);
        await fs.writeFile(filePath, JSON.stringify(keys, null, 2));
    }
    async getKey(address: string, blockchain: ChainType): Promise<WalletKeys | null> {
        this.logger.log(`Getting key for address: ${address.toLocaleUpperCase()} and blockchain: ${blockchain}`);
        const filePath = path.join(this.storageDir, `${blockchain.toLocaleUpperCase()}_${address}.json`);
        this.logger.log(`Looking for file at path: ${filePath}`);
        // Log all files in storageDir for debugging
        try {
            const files = await fs.readdir(this.storageDir);
            this.logger.log(`Found ${files.length} files in ${this.storageDir}`);
        } catch (error) {
            this.logger.error('Error listing files in storage directory:', error);
        }
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            this.logger.log('Successfully read wallet file');
            return JSON.parse(data) as WalletKeys;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                this.logger.log('Wallet file not found');
                return null;
            }
            this.logger.error('Error reading wallet file:', error);
            throw error;
        }
    }

    async isInitialized() {
        try {
            const dirExists = await fs.stat(this.storageDir).then(() => true).catch(() => false);
            return dirExists;
        } catch (error) {
            this.logger.error('Error checking if storage directory is initialized:', error);
            return false;
        }
    }
}
