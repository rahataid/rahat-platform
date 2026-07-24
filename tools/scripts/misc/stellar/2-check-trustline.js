require('dotenv').config({ path: __dirname + '/.env.stellar' });

const { Horizon, Networks } = require('@stellar/stellar-sdk');
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

console.log(`🔍 Checking trustlines for asset: ${ASSET_CODE} issued by ${ASSET_ISSUER}`);

const checkTrustline = async (accountAddress) => {
    try {
        console.log(`Checking trustline for account: ${accountAddress}`);

        // Load the account
        const account = await horizonServer.loadAccount(accountAddress);

        // Check if account has trustline for the specified asset
        const trustline = account.balances.find(balance =>
            balance.asset_code === ASSET_CODE &&
            balance.asset_issuer === ASSET_ISSUER
        );

        const accountInfo = {
            address: accountAddress,
            hasTrustline: !!trustline,
            balance: trustline ? trustline.balance : null,
            limit: trustline ? trustline.limit : null,
            assetCode: ASSET_CODE,
            assetIssuer: ASSET_ISSUER
        };

        if (trustline) {
            console.log(`✅ Account ${accountAddress} has trustline with balance: ${trustline.balance} ${ASSET_CODE}`);
        } else {
            console.log(`❌ Account ${accountAddress} does not have trustline for ${ASSET_CODE}`);
        }

        return accountInfo;

    } catch (error) {
        console.error(`❌ Error checking trustline for account ${accountAddress}:`, error.message);

        return {
            address: accountAddress,
            hasTrustline: false,
            balance: null,
            limit: null,
            assetCode: ASSET_CODE,
            assetIssuer: ASSET_ISSUER,
            error: error.message
        };
    }
};

const main = async () => {
    try {
        // Read account details from JSON file
        const accountDetailsPath = path.join(__dirname, './.data/account-details.json');

        if (!fs.existsSync(accountDetailsPath)) {
            console.error('❌ Account details file not found at:', accountDetailsPath);
            console.log('Please run check-account.js first to generate the account details file.');
            return;
        }

        const accountDetailsRaw = fs.readFileSync(accountDetailsPath, 'utf8');
        const accountDetails = JSON.parse(accountDetailsRaw);

        console.log(`📊 Found ${accountDetails.length} accounts in the details file`);

        // Filter only existing accounts
        const existingAccounts = accountDetails.filter(account => account.exists);

        if (existingAccounts.length === 0) {
            console.log('❌ No existing accounts found. Please create accounts first.');
            return;
        }

        console.log(`🔍 Checking trustlines for ${existingAccounts.length} existing accounts:`);
        existingAccounts.forEach(account => {
            console.log(`  - ${account.address}`);
        });

        // Check trustlines for each existing account
        const trustlineDetails = [];
        for (const account of existingAccounts) {
            const trustlineInfo = await checkTrustline(account.address);
            trustlineDetails.push(trustlineInfo);

            // Add a small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Summary
        const accountsWithTrustline = trustlineDetails.filter(detail => detail.hasTrustline);
        const accountsWithoutTrustline = trustlineDetails.filter(detail => !detail.hasTrustline);

        console.log('\n📊 Trustline Check Summary:');
        console.log(`✅ Accounts with trustline: ${accountsWithTrustline.length}`);
        console.log(`❌ Accounts without trustline: ${accountsWithoutTrustline.length}`);

        if (accountsWithoutTrustline.length > 0) {
            console.log('\n❌ Accounts without trustline:');
            accountsWithoutTrustline.forEach(detail => {
                console.log(`  - ${detail.address}`);
            });
        }

        if (accountsWithTrustline.length > 0) {
            console.log('\n✅ Accounts with trustline:');
            accountsWithTrustline.forEach(detail => {
                console.log(`  - ${detail.address}: ${detail.balance} ${detail.assetCode}`);
            });
        }

        // Save trustline details to JSON file
        const outputPath = path.join(__dirname, './.data/trustline-details.json');

        // Ensure .data directory exists
        const dataDir = path.dirname(outputPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(trustlineDetails, null, 2));
        console.log(`\n💾 Trustline details saved to: ${outputPath}`);

    } catch (error) {
        console.error('❌ Error in main function:', error);
    }
};

main()
    .then(() => console.log('\n🎉 Trustline check completed.'))
    .catch(error => console.error('❌ Error in trustline check:', error));