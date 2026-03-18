require('dotenv').config({ path: __dirname + '/.env.stellar' });

const { Horizon, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder } = require('@stellar/stellar-sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const NETWORK = process.env.NETWORK || 'TESTNET';

// Stellar server based on network environment
const serverUrl = NETWORK === 'MAINNET' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
const networkPassphrase = NETWORK === 'MAINNET' ? Networks.PUBLIC : Networks.TESTNET;
const horizonServer = new Horizon.Server(serverUrl);

// Funding account from environment
const FUNDING_ACCOUNT_SECRET = process.env.FUNDING_ACCOUNT_SECRET;

if (!FUNDING_ACCOUNT_SECRET) {
    console.error('❌ FUNDING_ACCOUNT_SECRET is required in .env file');
    process.exit(1);
}

const fundAccount = async (destinationPublicKey) => {
    try {
        console.log(`Creating account: ${destinationPublicKey} with 2 XLM starting balance`);

        // Create keypair from funding account secret
        const fundingKeypair = Keypair.fromSecret(FUNDING_ACCOUNT_SECRET);
        const fundingPublicKey = fundingKeypair.publicKey();
        console.log(`Funding account public key: ${fundingPublicKey}`);
        // Load the funding account
        const fundingAccount = await horizonServer.loadAccount(fundingPublicKey);
        const { balance } = fundingAccount.balances.find(b => b.asset_type === 'native');

        console.log(`Funding account ${fundingPublicKey} exists with balance: ${balance} XLM`);

        // Create account operation with 2 XLM starting balance
        const createAccountOp = Operation.createAccount({
            destination: destinationPublicKey,
            startingBalance: '2' // 2 XLM starting balance
        });
        console.log({ createAccountOp })

        // Build transaction
        const transaction = new TransactionBuilder(fundingAccount, {
            fee: BASE_FEE,
            networkPassphrase: networkPassphrase
        })
            .addOperation(createAccountOp)
            .setTimeout(30) // Set timeout to 30 seconds
            .build();

        // Sign transaction
        transaction.sign(fundingKeypair);

        // Submit transaction
        const result = await horizonServer.submitTransaction(transaction);

        if (result.successful) {
            console.log(`✅ Successfully created account: ${destinationPublicKey} with 2 XLM starting balance`);
            console.log(`Transaction hash: ${result.hash}`);
            return true;
        } else {
            console.error(`❌ Failed to create account: ${destinationPublicKey}`, result);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error creating account ${destinationPublicKey}:`, error.message);
        return false;
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

        // Filter accounts that don't exist
        const nonExistentAccounts = accountDetails.filter(account => !account.exists);

        if (nonExistentAccounts.length === 0) {
            console.log('✅ All accounts already exist. No account creation needed.');
            return;
        }

        console.log(`💰 Found ${nonExistentAccounts.length} accounts that need to be created:`);
        nonExistentAccounts.forEach(account => {
            console.log(`  - ${account.address}`);
        });

        // Create each non-existent account
        const fundingResults = [];
        for (const account of nonExistentAccounts) {
            const success = await fundAccount(account.address);
            fundingResults.push({
                address: account.address,
                funded: success
            });

            // Add a small delay between funding requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Summary
        const successfulFunding = fundingResults.filter(result => result.funded);
        const failedFunding = fundingResults.filter(result => !result.funded);

        console.log('\n📊 Account Creation Summary:');
        console.log(`✅ Successfully created: ${successfulFunding.length} accounts`);
        console.log(`❌ Failed to create: ${failedFunding.length} accounts`);

        if (failedFunding.length > 0) {
            console.log('\n❌ Failed accounts:');
            failedFunding.forEach(result => {
                console.log(`  - ${result.address}`);
            });
        }

        // Update account details file with new funding status
        if (successfulFunding.length > 0) {
            console.log('\n🔄 Updating account details file...');

            // Re-check funded accounts to get updated balance information
            for (const result of successfulFunding) {
                try {
                    const account = await horizonServer.loadAccount(result.address);
                    const { balance } = account.balances.find(b => b.asset_type === 'native');

                    // Update the account details
                    const accountIndex = accountDetails.findIndex(acc => acc.address === result.address);
                    if (accountIndex !== -1) {
                        accountDetails[accountIndex].exists = true;
                        accountDetails[accountIndex].balance = balance;
                    }
                } catch (error) {
                    console.warn(`⚠️  Could not verify funding for ${result.address}:`, error.message);
                }
            }

            // Save updated account details
            fs.writeFileSync(accountDetailsPath, JSON.stringify(accountDetails, null, 2));
            console.log('✅ Account details file updated');
        }

    } catch (error) {
        console.error('❌ Error in main function:', error);
    }
};

main()
    .then(() => console.log('\n🎉 Account funding process completed.'))
    .catch(error => console.error('❌ Error in account funding:', error));