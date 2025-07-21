require('dotenv').config({ path: __dirname + '/.env.stellar' });

const { Horizon, Asset, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder } = require('@stellar/stellar-sdk');
const fs = require('fs');
const path = require('path');

const NETWORK = process.env.NETWORK || 'TESTNET';
const ASSET_CODE = process.env.ASSET_CODE;
const ASSET_ISSUER = process.env.ASSET_ISSUER;

// Stellar server based on network environment
const serverUrl = NETWORK === 'MAINNET' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
const networkPassphrase = NETWORK === 'MAINNET' ? Networks.PUBLIC : Networks.TESTNET;
const horizonServer = new Horizon.Server(serverUrl);

// Validate required environment variables
if (!ASSET_CODE) {
    console.error('❌ ASSET_CODE is required in .env.stellar file');
    process.exit(1);
}

if (!ASSET_ISSUER) {
    console.error('❌ ASSET_ISSUER is required in .env.stellar file');
    process.exit(1);
}

console.log(`🔧 Adding trustlines for asset: ${ASSET_CODE} issued by ${ASSET_ISSUER}`);

const loadWalletSecrets = () => {
    const walletStoragePath = path.join(__dirname, './.data/wallet_storage');
    const wallets = {};

    try {
        if (!fs.existsSync(walletStoragePath)) {
            console.warn('⚠️  Wallet storage directory not found:', walletStoragePath);
            return wallets;
        }

        const files = fs.readdirSync(walletStoragePath);

        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const filePath = path.join(walletStoragePath, file);
                    const walletData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                    if (walletData.publicKey && walletData.privateKey) {
                        wallets[walletData.publicKey] = walletData.privateKey;
                        console.log(`📄 Loaded wallet: ${walletData.publicKey.substring(0, 8)}...`);
                    }
                } catch (error) {
                    console.warn(`⚠️  Error reading wallet file ${file}:`, error.message);
                }
            }
        }

        console.log(`📊 Loaded ${Object.keys(wallets).length} wallets from storage`);
        return wallets;
    } catch (error) {
        console.error('❌ Error loading wallet secrets:', error.message);
        return wallets;
    }
};

const saveUnknownWallets = (unknownWallets) => {
    try {
        const dataDir = path.join(__dirname, './.data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const unknownWalletsPath = path.join(dataDir, 'unknown-wallets.json');
        const unknownWalletsData = unknownWallets.map(address => ({
            address: address,
            reason: 'Wallet secret not found in wallet_storage',
            timestamp: new Date().toISOString()
        }));

        fs.writeFileSync(unknownWalletsPath, JSON.stringify(unknownWalletsData, null, 2));
        console.log(`💾 Unknown wallets saved to: ${unknownWalletsPath}`);
    } catch (error) {
        console.error('❌ Error saving unknown wallets:', error.message);
    }
};

const addTrustline = async (accountAddress, walletSecret) => {
    try {
        console.log(`Adding trustline for account: ${accountAddress}`);

        // Create keypair from wallet secret
        const keypair = Keypair.fromSecret(walletSecret);

        // Verify the public key matches
        if (keypair.publicKey() !== accountAddress) {
            throw new Error(`Public key mismatch: expected ${accountAddress}, got ${keypair.publicKey()}`);
        }

        // Load the account
        const account = await horizonServer.loadAccount(accountAddress);

        // Create the asset
        const asset = new Asset(ASSET_CODE, ASSET_ISSUER);

        // Create change trust operation
        const changeTrustOp = Operation.changeTrust({
            asset: asset,
            limit: '922337203685.4775807' // Maximum limit
        });

        // Build transaction
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: networkPassphrase
        })
            .addOperation(changeTrustOp)
            .setTimeout(30)
            .build();

        // Sign transaction
        transaction.sign(keypair);

        // Submit transaction
        const result = await horizonServer.submitTransaction(transaction);

        if (result.successful) {
            console.log(`✅ Successfully added trustline for account: ${accountAddress}`);
            console.log(`Transaction hash: ${result.hash}`);
            return true;
        } else {
            console.error(`❌ Failed to add trustline for account: ${accountAddress}`, result);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error adding trustline for account ${accountAddress}:`, error.message);
        return false;
    }
};

const main = async () => {
    try {
        // Read trustline details from JSON file
        const trustlineDetailsPath = path.join(__dirname, './.data/trustline-details.json');

        if (!fs.existsSync(trustlineDetailsPath)) {
            console.error('❌ Trustline details file not found at:', trustlineDetailsPath);
            console.log('Please run 2-check-trustline.js first to generate the trustline details file.');
            return;
        }

        const trustlineDetailsRaw = fs.readFileSync(trustlineDetailsPath, 'utf8');
        const trustlineDetails = JSON.parse(trustlineDetailsRaw);

        console.log(`📊 Found ${trustlineDetails.length} accounts in trustline details`);

        // Filter accounts that don't have trustlines
        const accountsWithoutTrustline = trustlineDetails.filter(detail => !detail.hasTrustline);

        if (accountsWithoutTrustline.length === 0) {
            console.log('✅ All accounts already have trustlines. No action needed.');
            return;
        }

        console.log(`🔧 Found ${accountsWithoutTrustline.length} accounts that need trustlines:`);
        accountsWithoutTrustline.forEach(detail => {
            console.log(`  - ${detail.address}`);
        });

        // Load wallet secrets
        const walletSecrets = loadWalletSecrets();

        // Process each account
        const trustlineResults = [];
        const unknownWallets = [];

        for (const detail of accountsWithoutTrustline) {
            const accountAddress = detail.address;
            const walletSecret = walletSecrets[accountAddress];

            if (!walletSecret) {
                console.warn(`⚠️  Wallet secret not found for account: ${accountAddress}`);
                unknownWallets.push(accountAddress);
                trustlineResults.push({
                    address: accountAddress,
                    trustlineAdded: false,
                    error: 'Wallet secret not found'
                });
                continue;
            }

            const success = await addTrustline(accountAddress, walletSecret);
            trustlineResults.push({
                address: accountAddress,
                trustlineAdded: success
            });

            // Add a small delay between transactions to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Handle unknown wallets
        if (unknownWallets.length > 0) {
            console.log(`\n⚠️  Found ${unknownWallets.length} unknown wallets (secrets not in wallet_storage):`);
            unknownWallets.forEach(address => {
                console.log(`  - ${address}`);
            });
            saveUnknownWallets(unknownWallets);
        }

        // Summary
        const successfulTrustlines = trustlineResults.filter(result => result.trustlineAdded);
        const failedTrustlines = trustlineResults.filter(result => !result.trustlineAdded);

        console.log('\n📊 Trustline Addition Summary:');
        console.log(`✅ Successfully added trustlines: ${successfulTrustlines.length} accounts`);
        console.log(`❌ Failed to add trustlines: ${failedTrustlines.length} accounts`);

        if (failedTrustlines.length > 0) {
            console.log('\n❌ Failed accounts:');
            failedTrustlines.forEach(result => {
                console.log(`  - ${result.address}: ${result.error || 'Unknown error'}`);
            });
        }

        // Update trustline details file with new status
        if (successfulTrustlines.length > 0) {
            console.log('\n🔄 Updating trustline details file...');

            // Re-check trustlines for successfully updated accounts
            for (const result of successfulTrustlines) {
                try {
                    const account = await horizonServer.loadAccount(result.address);
                    const trustline = account.balances.find(balance =>
                        balance.asset_code === ASSET_CODE &&
                        balance.asset_issuer === ASSET_ISSUER
                    );

                    // Update the trustline details
                    const detailIndex = trustlineDetails.findIndex(detail => detail.address === result.address);
                    if (detailIndex !== -1 && trustline) {
                        trustlineDetails[detailIndex].hasTrustline = true;
                        trustlineDetails[detailIndex].balance = trustline.balance;
                        trustlineDetails[detailIndex].limit = trustline.limit;
                    }
                } catch (error) {
                    console.warn(`⚠️  Could not verify trustline for ${result.address}:`, error.message);
                }
            }

            // Save updated trustline details
            fs.writeFileSync(trustlineDetailsPath, JSON.stringify(trustlineDetails, null, 2));
            console.log('✅ Trustline details file updated');
        }

    } catch (error) {
        console.error('❌ Error in main function:', error);
    }
};

main()
    .then(() => console.log('\n🎉 Trustline addition process completed.'))
    .catch(error => console.error('❌ Error in trustline addition:', error));