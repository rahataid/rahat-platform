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

console.log(`💰 Checking asset balances for: ${ASSET_CODE} issued by ${ASSET_ISSUER}`);

const checkAssetBalance = async (accountAddress) => {
    try {
        console.log(`Checking asset balance for account: ${accountAddress}`);

        // Load the account
        const account = await horizonServer.loadAccount(accountAddress);

        // Find the specific asset balance
        const assetBalance = account.balances.find(balance =>
            balance.asset_code === ASSET_CODE &&
            balance.asset_issuer === ASSET_ISSUER
        );

        // Also get native XLM balance
        const nativeBalance = account.balances.find(balance =>
            balance.asset_type === 'native'
        );

        const balanceInfo = {
            address: accountAddress,
            assetCode: ASSET_CODE,
            assetIssuer: ASSET_ISSUER,
            balance: assetBalance ? assetBalance.balance : '0',
            hasTrustline: !!assetBalance,
            nativeBalance: nativeBalance ? nativeBalance.balance : '0'
        };

        if (assetBalance) {
            console.log(`✅ Account ${accountAddress} balance: ${assetBalance.balance} ${ASSET_CODE}`);
        } else {
            console.log(`❌ Account ${accountAddress} has no balance for ${ASSET_CODE} (no trustline or zero balance)`);
        }

        return balanceInfo;

    } catch (error) {
        console.error(`❌ Error checking balance for account ${accountAddress}:`, error.message);

        return {
            address: accountAddress,
            assetCode: ASSET_CODE,
            assetIssuer: ASSET_ISSUER,
            balance: null,
            hasTrustline: false,
            nativeBalance: null,
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

        console.log(`💰 Checking asset balances for ${existingAccounts.length} existing accounts:`);
        existingAccounts.forEach(account => {
            console.log(`  - ${account.address}`);
        });

        // Check asset balances for each existing account
        const assetBalances = [];
        for (const account of existingAccounts) {
            const balanceInfo = await checkAssetBalance(account.address);
            assetBalances.push(balanceInfo);

            // Add a small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Summary statistics
        const accountsWithBalance = assetBalances.filter(balance =>
            balance.hasTrustline && parseFloat(balance.balance) > 0
        );
        const accountsWithTrustlineButZeroBalance = assetBalances.filter(balance =>
            balance.hasTrustline && parseFloat(balance.balance) === 0
        );
        const accountsWithoutTrustline = assetBalances.filter(balance =>
            !balance.hasTrustline
        );
        const accountsWithErrors = assetBalances.filter(balance =>
            balance.error
        );

        // Calculate total balance
        const totalAssetBalance = assetBalances
            .filter(balance => balance.hasTrustline && balance.balance)
            .reduce((sum, balance) => sum + parseFloat(balance.balance), 0);

        console.log('\n📊 Asset Balance Summary:');
        console.log(`💰 Accounts with ${ASSET_CODE} balance: ${accountsWithBalance.length}`);
        console.log(`🔗 Accounts with trustline but zero balance: ${accountsWithTrustlineButZeroBalance.length}`);
        console.log(`❌ Accounts without trustline: ${accountsWithoutTrustline.length}`);
        console.log(`⚠️  Accounts with errors: ${accountsWithErrors.length}`);
        console.log(`💎 Total ${ASSET_CODE} across all accounts: ${totalAssetBalance.toFixed(7)}`);

        if (accountsWithBalance.length > 0) {
            console.log(`\n💰 Accounts with ${ASSET_CODE} balance:`);
            accountsWithBalance.forEach(balance => {
                console.log(`  - ${balance.address}: ${balance.balance} ${ASSET_CODE}`);
            });
        }

        if (accountsWithoutTrustline.length > 0) {
            console.log(`\n❌ Accounts without trustline:`);
            accountsWithoutTrustline.forEach(balance => {
                console.log(`  - ${balance.address}`);
            });
        }

        if (accountsWithErrors.length > 0) {
            console.log(`\n⚠️  Accounts with errors:`);
            accountsWithErrors.forEach(balance => {
                console.log(`  - ${balance.address}: ${balance.error}`);
            });
        }

        // Save asset balances to JSON file
        const outputPath = path.join(__dirname, './.data/asset-balance.json');

        // Ensure .data directory exists
        const dataDir = path.dirname(outputPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Add metadata to the output
        const outputData = {
            metadata: {
                assetCode: ASSET_CODE,
                assetIssuer: ASSET_ISSUER,
                network: NETWORK,
                timestamp: new Date().toISOString(),
                totalAccounts: existingAccounts.length,
                accountsWithBalance: accountsWithBalance.length,
                accountsWithTrustline: accountsWithBalance.length + accountsWithTrustlineButZeroBalance.length,
                totalAssetBalance: totalAssetBalance.toFixed(7)
            },
            balances: assetBalances
        };

        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
        console.log(`\n💾 Asset balances saved to: ${outputPath}`);

    } catch (error) {
        console.error('❌ Error in main function:', error);
    }
};

main()
    .then(() => console.log('\n🎉 Asset balance check completed.'))
    .catch(error => console.error('❌ Error in asset balance check:', error));