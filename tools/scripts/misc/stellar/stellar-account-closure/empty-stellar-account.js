const StellarSdk = require('stellar-sdk');
const fs = require('fs').promises;

// Configure Stellar SDK for mainnet
const HORIZON_SERVER =
  process.env.HORIZON_SERVER || 'https://horizon.stellar.org';
const server = new StellarSdk.Horizon.Server(HORIZON_SERVER);
const networkPassphrase = StellarSdk.Networks.PUBLIC;

// RAHAT asset details for mainnet
const RAHAT_ASSET_CODE = process.env.ASSET_CODE || 'RAHAT';
const RAHAT_ISSUER =
  process.env.ASSET_ISSUER ||
  'GCCZSP4KZVKIJLTY7HZS6TVNBFN6VB55A42HOLJHKCBVQRKDEVETUHHH';

// Function to load JSON file with account details
async function loadAccounts(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON file:', error.message);
    throw error;
  }
}

// Check if account exists on Stellar network
async function checkAccountExists(wallet) {
  try {
    await server.accounts().accountId(wallet).call();
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    return false;
  }
}

// Check if wallet has trustline
async function hasTrustline(publicKey) {
  try {
    const accountExists = await checkAccountExists(publicKey);

    if (!accountExists) {
      console.log('Account does not exist');
      return false;
    }

    const account = await server.loadAccount(publicKey);

    const trustlineExists = account.balances.some((balance) => {
      return (
        (balance.asset_type === 'credit_alphanum4' ||
          balance.asset_type === 'credit_alphanum12') &&
        balance.asset_code === RAHAT_ASSET_CODE &&
        balance.asset_issuer === RAHAT_ISSUER
      );
    });

    return trustlineExists;
  } catch (error) {
    console.error('Error checking trustline:', error);
    return false;
  }
}

// Function to process a single account
async function processAccount(
  account,
  receiverPublicKey,
  useAccountMerge = true
) {
  const { publicKey, secretKey } = account;
  console.log(`\n🔍 Processing account: ${publicKey}`);

  try {
    // Check if account exists
    const accountExists = await checkAccountExists(publicKey);
    if (!accountExists) {
      console.log(`❌ Account ${publicKey} does not exist on Stellar network`);
      return { status: 'failed', publicKey, error: 'Account does not exist' };
    }

    // Load account
    const sourceAccount = await server.loadAccount(publicKey);
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);

    // Check RAHAT balance
    const rahatBalance = sourceAccount.balances.find(
      (b) =>
        b.asset_code === RAHAT_ASSET_CODE && b.asset_issuer === RAHAT_ISSUER
    );
    const hasRahat = rahatBalance && parseFloat(rahatBalance.balance) > 0;

    // Check if account has trustline
    const hasTrustlineResult = await hasTrustline(publicKey);

    console.log(`   RAHAT Balance: ${hasRahat ? rahatBalance.balance : '0'}`);
    console.log(`   Has Trustline: ${hasTrustlineResult}`);

    // Build transaction
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: (await server.fetchBaseFee()).toString(),
      networkPassphrase,
    });

    // Operation 1: Send RAHAT asset to receiver (if balance exists)
    if (hasRahat) {
      console.log(
        `   💸 Sending ${rahatBalance.balance} RAHAT to ${receiverPublicKey}`
      );
      transaction.addOperation(
        StellarSdk.Operation.payment({
          destination: receiverPublicKey,
          asset: new StellarSdk.Asset(RAHAT_ASSET_CODE, RAHAT_ISSUER),
          amount: rahatBalance.balance,
        })
      );
    } else {
      console.log(`   ℹ️  No RAHAT balance found for ${publicKey}`);
    }

    // Operation 2: Remove RAHAT trustline (if it exists)
    if (hasTrustlineResult) {
      console.log(`   🔗 Removing RAHAT trustline for ${publicKey}`);
      transaction.addOperation(
        StellarSdk.Operation.changeTrust({
          asset: new StellarSdk.Asset(RAHAT_ASSET_CODE, RAHAT_ISSUER),
          limit: '0',
        })
      );
    } else {
      console.log(`   ℹ️  No RAHAT trustline found for ${publicKey}`);
    }

    // Operation 3: Empty the account
    if (useAccountMerge) {
      // Account Merge: Transfers all remaining XLM to receiver and deletes the account
      console.log(
        `   🗑️  Merging account ${publicKey} to ${receiverPublicKey}`
      );
      transaction.addOperation(
        StellarSdk.Operation.accountMerge({
          destination: receiverPublicKey,
        })
      );
    } else {
      // Payment: Send remaining XLM to receiver (keeps account alive with minimum balance)
      const xlmBalance = sourceAccount.balances.find(
        (b) => b.asset_type === 'native'
      );
      const availableXlm = parseFloat(xlmBalance.balance) - 1.0; // Keep 1 XLM for reserve

      if (availableXlm > 0.00001) {
        // Only send if more than minimum fee
        console.log(
          `   💸 Sending ${availableXlm.toFixed(7)} XLM to ${receiverPublicKey}`
        );
        transaction.addOperation(
          StellarSdk.Operation.payment({
            destination: receiverPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: availableXlm.toFixed(7),
          })
        );
      } else {
        console.log(
          `   ℹ️  Insufficient XLM to send (minimum reserve required)`
        );
      }
    }

    // Set timeout and build transaction
    transaction.setTimeout(30);
    const builtTx = transaction.build();

    // Sign transaction
    builtTx.sign(sourceKeypair);

    // Submit transaction
    const result = await server.submitTransaction(builtTx);
    console.log(
      `   ✅ Account ${publicKey} emptied successfully. Tx hash: ${result.hash}`
    );

    return { status: 'success', publicKey, txHash: result.hash };
  } catch (error) {
    console.error(
      `   ❌ Error processing ${publicKey}:`,
      error.response?.data || error.message
    );
    return { status: 'failed', publicKey, error: error.message };
  }
}

// Main function to process all accounts
async function emptyAccounts(
  jsonFilePath,
  receiverPublicKey,
  useAccountMerge = true
) {
  try {
    console.log(`🚀 Starting account emptying process...`);
    console.log(`   Horizon Server: ${HORIZON_SERVER}`);
    console.log(
      `   Network: ${
        networkPassphrase === StellarSdk.Networks.TESTNET
          ? 'TESTNET'
          : 'MAINNET'
      }`
    );
    console.log(`   RAHAT Asset: ${RAHAT_ASSET_CODE}:${RAHAT_ISSUER}`);
    console.log(`   Receiver: ${receiverPublicKey}`);
    console.log(
      `   Method: ${useAccountMerge ? 'Account Merge' : 'Payment'}\n`
    );

    // Validate receiver public key
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(receiverPublicKey)) {
      throw new Error('Invalid receiver public key');
    }

    // Load accounts from JSON
    const accounts = await loadAccounts(jsonFilePath);
    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('JSON file must contain an array of accounts');
    }

    console.log(`📊 Found ${accounts.length} accounts to process\n`);

    // Process accounts sequentially
    const results = [];
    for (const account of accounts) {
      if (!account.publicKey || !account.secretKey) {
        console.error(`Invalid account data: ${JSON.stringify(account)}`);
        results.push({
          status: 'failed',
          publicKey: account.publicKey || 'unknown',
          error: 'Missing publicKey or secretKey',
        });
        continue;
      }
      const result = await processAccount(
        account,
        receiverPublicKey,
        useAccountMerge
      );
      results.push(result);

      // Add delay between transactions to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Log summary
    console.log('\n📊 Processing Summary:');
    console.log('='.repeat(60));
    const successful = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    console.log(`Total accounts: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(60));

    results.forEach((result) => {
      console.log(
        `${result.publicKey}: ${result.status}${
          result.txHash ? ` (Tx: ${result.txHash})` : ''
        }${result.error ? ` - ${result.error}` : ''}`
      );
    });

    return results;
  } catch (error) {
    console.error('❌ Error in emptyAccounts:', error.message);
    throw error;
  }
}

// Show usage information
function showUsage() {
  console.log(`
🗑️  Stellar Account Emptying Script

Usage:
  node empty-stellar-account.js [options]

Options:
  --merge     Use account merge (default) - deletes account and transfers all XLM
  --payment   Use payment only - keeps account alive with minimum balance
  --help      Show this help message

Environment Variables:
  HORIZON_SERVER    Stellar horizon server (default: https://horizon.stellar.org)
  ASSET_CODE        Asset code (default: RAHAT)
  ASSET_ISSUER      Asset issuer address

Account Merge vs Payment:
  🗑️  Account Merge:
     - Transfers ALL remaining XLM to receiver
     - DELETES the source account completely
     - No minimum balance left behind
     - Perfect for test accounts you want to completely remove
  
  💸 Payment Only:
     - Transfers available XLM (minus reserve)
     - KEEPS the source account alive
     - Leaves ~1 XLM for account reserve
     - Good if you want to reuse the account later

Examples:
  # Empty accounts using account merge (recommended for testing)
  node empty-stellar-account.js --merge

  # Empty accounts using payment only
  node empty-stellar-account.js --payment

  # With custom horizon server
  HORIZON_SERVER=https://horizon-testnet.stellar.org node empty-stellar-account.js --merge
`);
}

// Handle command line arguments
const args = process.argv.slice(2);
const useAccountMerge = !args.includes('--payment');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  showUsage();
  process.exit(0);
}

// Example usage
const jsonFilePath = 'tools/scripts/stellar/accounts.json';
const receiverPublicKey =
  'GAZAUII5ABWMNCXKLU6V4D6YDFQ5N3VVXAD4HALDXFFRH6LHGRRMVNQI'; // Replace with actual receiver public key

emptyAccounts(jsonFilePath, receiverPublicKey, useAccountMerge)
  .then(() => console.log('\n🎉 All accounts processed'))
  .catch((error) =>
    console.error('❌ Failed to process accounts:', error.message)
  );
