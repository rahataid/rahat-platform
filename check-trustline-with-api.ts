import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Asset, Horizon, Keypair, Networks, Operation, TransactionBuilder } from 'stellar-sdk';
import { StellarWallet } from './libs/wallet/src/stellar/wallet';
import { ChainType, WalletKeys, WalletStorage } from './libs/wallet/src/types';

// Local FileWalletStorage implementation
class FileWalletStorage implements WalletStorage {
    private storageDir: string;

    constructor(storageDir: string = './wallet_storage') {
        this.storageDir = storageDir;
    }

    async init() {
        console.log("Making new directory");
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
        } catch (error) {
            console.error('Error creating storage directory:', error);
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
            await fs.readdir(this.storageDir);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Types
interface BeneficiarySecret {
    address: string;
    privateKey: string;
    publicKey: string;
}

interface NotFoundBen {
    walletAddress: string;
    uuid: string;
}

interface NoTrustlineBen {
    walletAddress: string;
    secretKey: string;
}

interface NoWalletBen {
    uuid: string;
}

// Database Configuration
const CORE_DB_URL = process.env.DATABASE_URL || 'postgresql://admin:admin@localhost:5432/rahat?schema=public';
const PROJECT_DB_URL = process.env.PROJECT_DATABASE_URL || 'postgresql://rahat:rahat123@localhost:5555/rahat-aa?schema=public';

// Stellar Configuration
const HORIZON_SERVER = process.env.HORIZON_SERVER || 'https://horizon-testnet.stellar.org';
const ASSET_CODE = process.env.ASSET_CODE || 'RAHAT';
const ASSET_ISSUER = process.env.ASSET_ISSUER || 'GCVLRQHGZYG32HZE3PKZ52NX5YFCNFDBUZDLUXQYMRS6WVBWSUOP5IYE';
const FAUCET_BASE_URL = 'http://localhost:3232';
const FAUCET_AUTH_KEY = "faucet_dce1b1e499f9cc62abde270779522b49c8c8fc4cb95085d295356845d002a7d6";
const NETWORK = 'stellar_testnet';
const HORIZON_SERVER_TESTNET = 'https://horizon-testnet.stellar.org';

// Initialize services
const corePrisma = new PrismaClient({
    datasources: {
        db: {
            url: CORE_DB_URL,
        },
    },
});

const projectPrisma = new PrismaClient({
    datasources: {
        db: {
            url: PROJECT_DB_URL,
        },
    },
});

const walletStorage = new FileWalletStorage();
const stellarWallet = new StellarWallet(HORIZON_SERVER, walletStorage);

// Stellar server instance
const server = new Horizon.Server(HORIZON_SERVER);

// Check if account exists on Stellar network
async function checkAccountExists(wallet: string): Promise<boolean> {
    try {
        const server = new Horizon.Server(HORIZON_SERVER_TESTNET);
        await server.accounts().accountId(wallet).call();
        return true;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return false;
        }
        return false;
    }
}

// Check if wallet has trustline
async function hasTrustline(publicKey: string): Promise<boolean> {
    try {
        const accountExists = await checkAccountExists(publicKey);

        if (!accountExists) {
            console.log('Account does not exist');
            return false;
        }

        const account = await server.loadAccount(publicKey);

        const trustlineExists = account.balances.some((balance: any) => {
            return (
                (balance.asset_type === 'credit_alphanum4' ||
                    balance.asset_type === 'credit_alphanum12') &&
                balance.asset_code === ASSET_CODE &&
                balance.asset_issuer === ASSET_ISSUER
            );
        });

        return trustlineExists;
    } catch (error) {
        console.error('Error checking trustline:', error);
        return false;
    }
}

// Wait for transaction to be confirmed on Stellar network
async function waitForTransactionConfirmation(txHash: string, maxWaitTime: number = 60000): Promise<boolean> {
    if (!txHash) {
        console.log(`⚠️  No transaction hash provided, skipping confirmation check`);
        return false;
    }

    console.log(`⏳ Waiting for transaction confirmation: ${txHash}`);
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
        try {
            const transaction = await server.transactions().transaction(txHash).call();
            if (transaction.successful) {
                console.log(`✅ Transaction confirmed successfully: ${txHash}`);
                return true;
            } else {
                console.log(`❌ Transaction failed: ${txHash}`);
                return false;
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Transaction not found yet, wait and retry
                console.log(`⏳ Transaction not found yet, waiting... (${Math.round((Date.now() - startTime) / 1000)}s)`);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
                continue;
            } else {
                console.error(`❌ Error checking transaction: ${error.message}`);
                return false;
            }
        }
    }

    console.log(`⏰ Timeout waiting for transaction confirmation: ${txHash}`);
    return false;
}

// Fund account using external faucet
async function fundAccount(receiverPk: string): Promise<{ success: boolean; txHash?: string }> {
    try {
        console.log(`💰 Requesting faucet funding for ${receiverPk}...`);

        const faucetUrl = `${FAUCET_BASE_URL}/faucet/${NETWORK}/${receiverPk}`;

        const response = await axios.get(faucetUrl, {
            headers: {
                Authorization: `Bearer ${FAUCET_AUTH_KEY}`,
            },
            timeout: 30000, // 30 second timeout
        });

        console.log(`📡 Faucet response status: ${response.status}`);
        console.log(`📡 Faucet response data:`, response.data);

        if (response.status === 200) {
            // Extract transaction hash from response
            const txHash = response.data?.txHash || response.data?.transaction_hash || response.data?.hash;
            console.log(`✅ Successfully funded ${receiverPk} from external faucet`);
            console.log(`📝 Transaction hash: ${txHash || 'Not provided'}`);
            return { success: true, txHash };
        } else {
            console.error(`❌ Faucet returned non-200 status: ${response.status}`);
            return { success: false };
        }
    } catch (error: any) {
        console.error(`❌ Error in fundAccount: ${error.message}`);

        if (error.response) {
            console.error(`❌ Faucet API error status: ${error.response.status}`);
            console.error(`❌ Faucet API error data:`, error.response.data);
        } else if (error.request) {
            console.error(`❌ No response received from faucet. Check if faucet service is running.`);
        } else {
            console.error(`❌ Request setup error:`, error.message);
        }

        return { success: false };
    }
}

// Add trustline to wallet
async function addTrustline(
    publicKey: string,
    secretKey: string
): Promise<void> {
    console.log(`🔗 Adding trustline to: ${publicKey}`);

    if (!ASSET_CODE || !ASSET_ISSUER) {
        console.error('Asset code or issuer not found');
        throw new Error('Asset code or issuer not found');
    }

    if (!publicKey || !secretKey) {
        console.error('Public key or secret key not found');
        throw new Error('Public key or secret key not found');
    }

    // Check if account exists on Stellar network
    const accountExists = await checkAccountExists(publicKey);

    if (!accountExists) {
        console.log(`📝 Account doesn't exist on Stellar network: ${publicKey}`);

        if (!FAUCET_AUTH_KEY) {
            throw new Error('Account needs to be funded but no FAUCET_AUTH_KEY provided');
        }

        // Fund the account first
        const fundingResult = await fundAccount(publicKey);

        if (!fundingResult.success) {
            throw new Error(`Failed to fund account ${publicKey} via faucet`);
        }

        // Wait for the funding transaction to be confirmed
        if (fundingResult.txHash) {
            const confirmed = await waitForTransactionConfirmation(fundingResult.txHash, 60000); // 1 minute timeout
            if (!confirmed) {
                throw new Error(`Funding transaction for ${publicKey} was not confirmed within timeout`);
            }
        } else {
            // No transaction hash provided, wait a bit and check if account exists
            console.log(`⏳ No transaction hash provided, waiting for account creation...`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

            const accountNowExists = await checkAccountExists(publicKey);
            if (!accountNowExists) {
                throw new Error(`Account ${publicKey} was not created after funding`);
            }
        }
    }

    console.log("Account exists, adding trustline", secretKey, publicKey);

    const rahatAsset = new Asset(ASSET_CODE, ASSET_ISSUER);
    const account = await server.loadAccount(publicKey);

    const transaction = new TransactionBuilder(account, {
        fee: (await server.fetchBaseFee()).toString(),
        networkPassphrase: Networks.TESTNET,
    })
        .addOperation(
            Operation.changeTrust({
                asset: rahatAsset,
            })
        )
        .setTimeout(100)
        .build();

    transaction.sign(Keypair.fromSecret(secretKey));

    await server.submitTransaction(transaction);
    console.log(`✅ Trustline added successfully to: ${publicKey}`);
}

// Get beneficiary secret from wallet storage
async function getSecretByWallet(
    walletAddress: string
): Promise<BeneficiarySecret | null> {
    try {
        console.log(`🔍 Getting secret for wallet: ${walletAddress}`);

        // Try to get wallet keys from storage for stellar blockchain
        const walletKeys = await walletStorage.getKey(walletAddress, 'stellar');

        if (walletKeys) {
            console.log(`✅ Found wallet keys for stellar: ${walletKeys.address}`);
            return {
                address: walletKeys.address,
                privateKey: walletKeys.privateKey,
                publicKey: walletKeys.publicKey || walletKeys.address
            };
        }

        console.log(`❌ No wallet keys found for address: ${walletAddress}`);
        return null;
    } catch (error) {
        console.error(`❌ Error getting secret for wallet ${walletAddress}:`);
        return null;
    }
}

// Create new stellar wallet and save to storage
async function createStellarWallet(): Promise<BeneficiarySecret> {
    try {
        console.log('🔧 Creating new stellar wallet...');
        const connectedWallet = await stellarWallet.createWallet();
        const walletKeys = connectedWallet.getWalletKeys();

        console.log(`✅ Created new stellar wallet: ${walletKeys.address}`);
        return {
            address: walletKeys.address,
            privateKey: walletKeys.privateKey,
            publicKey: walletKeys.publicKey || walletKeys.address
        };
    } catch (error) {
        console.error('❌ Error creating stellar wallet:', error);
        throw error;
    }
}

// Update beneficiary wallet address in both databases
async function updateBeneficiaryWallet(
    beneficiaryUuid: string,
    walletAddress: string,
    mode: 'dry' | 'live'
): Promise<void> {
    try {
        console.log(`🔄 ${mode === 'dry' ? 'Mock' : 'Updating'} beneficiary ${beneficiaryUuid} with wallet: ${walletAddress}`);

        if (mode === 'live') {
            // Update in project database - only update walletAddress field
            await projectPrisma.beneficiary.updateMany({
                where: { uuid: beneficiaryUuid },
                data: { walletAddress }
            });

            // Update in core database - only update walletAddress field
            await corePrisma.beneficiary.updateMany({
                where: { uuid: beneficiaryUuid },
                data: { walletAddress }
            });

            console.log(`✅ Updated beneficiary ${beneficiaryUuid} in both databases`);
        } else {
            console.log(`✅ Mock update completed for ${beneficiaryUuid}`);
        }
    } catch (error) {
        console.error(`❌ Error updating beneficiary ${beneficiaryUuid}:`, error);
        throw error;
    }
}

async function checkBulkTrustline(mode: 'dry' | 'live' = 'dry'): Promise<void> {
    console.log(`🚀 Starting bulk trustline check in ${mode} mode...\n`);

    try {
        // Validate faucet auth key for live mode
        if (mode === 'live' && !FAUCET_AUTH_KEY) {
            console.error('❌ FAUCET_AUTH_KEY environment variable is required for live mode');
            console.error('   This key is used to fund new Stellar accounts via external faucet');
            throw new Error('FAUCET_AUTH_KEY not provided');
        }

        // Initialize wallet storage
        await walletStorage.init();
        await stellarWallet.init();

        // Get all beneficiaries from project database
        console.log('🔍 Fetching beneficiaries from project database...');
        const beneficiaries = await projectPrisma.beneficiary.findMany({
            where: {
                deletedAt: null,
            },
            select: {
                uuid: true,
                walletAddress: true,
            },
        });

        if (!beneficiaries.length) {
            console.log('⚠️  No beneficiaries found');
            return;
        }

        console.log(`📊 Found ${beneficiaries.length} beneficiaries to check\n`);

        let notFoundBen: NotFoundBen[] = [];
        let noTrustlineBen: NoTrustlineBen[] = [];
        let noWalletBen: NoWalletBen[] = [];
        let updatedCount = 0;
        let walletCreatedCount = 0;

        // Check each beneficiary
        for (const beneficiary of beneficiaries) {
            console.log(`🔍 Checking beneficiary: ${beneficiary.uuid}`);
            console.log(`   Wallet address: ${beneficiary.walletAddress || 'NULL'}`);

            // Check if beneficiary has wallet address
            if (!beneficiary.walletAddress) {
                console.log(`❌ No wallet address for beneficiary: ${beneficiary.uuid}`);
                noWalletBen.push({
                    uuid: beneficiary.uuid
                });
                continue;
            }

            // Check if wallet exists in storage
            const secret = await getSecretByWallet(beneficiary.walletAddress);

            if (!secret) {
                console.log(`❌ Secret not found for wallet: ${beneficiary.walletAddress}`);
                notFoundBen.push({
                    walletAddress: beneficiary.walletAddress,
                    uuid: beneficiary.uuid,
                });
                continue;
            }

            console.log(`✅ Wallet found: ${secret.address}, checking trustline...`);
            const hasTrustlineResult = await hasTrustline(secret.address);

            if (!hasTrustlineResult) {
                console.log(`❌ Trustline not found for wallet: ${beneficiary.walletAddress}`);
                noTrustlineBen.push({
                    walletAddress: secret.address,
                    secretKey: secret.privateKey,
                });
            } else {
                console.log(`✅ Trustline found for wallet: ${beneficiary.walletAddress}`);
            }

            updatedCount++;
        }

        // Debug: Show counts after processing all beneficiaries
        console.log('\n🔍 DEBUG: Counts after processing beneficiaries:');
        console.log(`   noWalletBen.length: ${noWalletBen.length}`);
        console.log(`   notFoundBen.length: ${notFoundBen.length}`);
        console.log(`   noTrustlineBen.length: ${noTrustlineBen.length}`);
        console.log(`   updatedCount: ${updatedCount}`);

        // Summary
        console.log('\n📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total beneficiaries: ${beneficiaries.length}`);
        console.log(`Without wallet address: ${noWalletBen.length}`);
        console.log(`Without wallet in storage: ${notFoundBen.length}`);
        console.log(`Without trustline: ${noTrustlineBen.length}`);
        console.log(
            `Already have trustline: ${beneficiaries.length - noWalletBen.length - notFoundBen.length - noTrustlineBen.length
            }`
        );
        console.log(`Database updates: ${updatedCount}`);

        // Stop if dry mode
        if (mode !== 'live') {
            if (noWalletBen.length > 0) {
                console.log('\n⚠️  Beneficiaries without wallet address:');
                noWalletBen.forEach((ben) => {
                    console.log(`   - ${ben.uuid}`);
                });
            }

            if (notFoundBen.length > 0) {
                console.log('\n⚠️  Beneficiaries without wallet in storage:');
                notFoundBen.forEach((ben) => {
                    console.log(`   - ${ben.uuid}: ${ben.walletAddress}`);
                });
            }

            if (noTrustlineBen.length > 0) {
                console.log('\n⚠️  Beneficiaries without trustline:');
                noTrustlineBen.forEach((ben) => {
                    console.log(`   - ${ben.walletAddress}`);
                });
            }

            console.log('\n🔍 Dry run completed. Run with --live to apply changes.');
            return;
        }

        // Create wallets for beneficiaries without wallet addresses
        if (notFoundBen.length > 0) {
            console.log(`\n🔧 Creating wallets for ${notFoundBen.length} beneficiaries...`);

            for (const ben of notFoundBen) {
                try {
                    const newWallet = await createStellarWallet();
                    await updateBeneficiaryWallet(ben.uuid, newWallet.address, 'live');
                    walletCreatedCount++;

                    // Add to noTrustlineBen list to add trustline later
                    noTrustlineBen.push({
                        walletAddress: newWallet.address,
                        secretKey: newWallet.privateKey,
                    });
                } catch (error) {
                    console.error(`Failed to create wallet for ${ben.uuid}:`, error);
                }
            }

            console.log(`✅ Created ${walletCreatedCount} new wallets`);
        }

        // Add trustlines for beneficiaries without trustlines
        if (noTrustlineBen.length > 0) {
            console.log(`\n🔗 Adding trustlines for ${noTrustlineBen.length} beneficiaries...`);

            for (const ben of noTrustlineBen) {
                try {
                    await addTrustline(ben.walletAddress, ben.secretKey);
                } catch (error) {
                    console.error(
                        `Failed to add trustline for ${ben.walletAddress}:`,
                        error
                    );
                }
            }

            console.log(`✅ Completed adding trustlines for ${noTrustlineBen.length} beneficiaries`);
        }

        console.log('\n🎉 Bulk trustline check completed successfully!');
    } catch (error) {
        console.error('❌ Error in bulk trustline check:', error);
        throw error;
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const mode = args.includes('--live') ? 'live' : 'dry';

    try {
        console.log('🔧 Initializing services...');

        // Test database connections
        await corePrisma.$connect();
        console.log('✅ Connected to core database');

        await projectPrisma.$connect();
        console.log('✅ Connected to project database');

        await checkBulkTrustline(mode);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    } finally {
        await corePrisma.$disconnect();
        await projectPrisma.$disconnect();
    }
}

// Show usage
function showUsage(): void {
    console.log(`
🔗 Bulk Trustline Check Script with Database Integration

Usage:
  npm run check-trustline-api [options]
  node check-trustline-with-api.ts [options]

Options:
  --live    Apply changes (default: dry run)
  --help    Show this help message

Environment Variables:
  DATABASE_URL           Core database URL (default: postgresql://admin:admin@localhost:5432/rahat)
  PROJECT_DATABASE_URL   Project database URL (default: postgresql://rahat:rahat123@localhost:5555/rahat-aa)
  HORIZON_SERVER         Stellar horizon server (default: https://horizon-testnet.stellar.org)
  ASSET_CODE             Asset code (default: RAHAT)
  ASSET_ISSUER           Asset issuer address
  NETWORK                Stellar network (default: testnet)
  FAUCET_BASE_URL        Faucet service URL (default: https://faucet.stellar.org)
  FAUCET_AUTH_KEY        Authentication key for faucet service (required for live mode)
  WALLET_PATH            Path to wallet storage directory

Examples:
  # Dry run (check only, no changes)
  node check-trustline-with-api.ts

  # Live run (apply changes)
  node check-trustline-with-api.ts --live

  # With custom database URLs
  DATABASE_URL=postgresql://user:pass@host:5432/db PROJECT_DATABASE_URL=postgresql://user:pass@host:5555/db node check-trustline-with-api.ts

Process:
  1. Connect to both core and project databases
  2. Get all beneficiaries from project database
  3. Check if beneficiary has wallet address
  4. Check if wallet exists in filesystem storage
  5. Create stellar wallet if missing (live mode only)
  6. Check if account exists on Stellar network
  7. Fund account using external faucet if it doesn't exist (live mode only)
  8. Wait for funding transaction confirmation (up to 1 minute)
  9. Check trustline on Stellar network
  10. Add trustline if missing (live mode only)
  11. Update databases with new wallet addresses (live mode only)
`);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
}

// Run the script
main(); 