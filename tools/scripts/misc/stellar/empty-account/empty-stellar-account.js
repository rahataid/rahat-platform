const StellarSdk = require('@stellar/stellar-sdk');
const fs = require('fs').promises;
const path = require('path');

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

// Function to load wallets from wallet storage
async function loadWalletsFromStorage(walletStoragePath) {
  const wallets = [];

  try {
    // Check if wallet storage directory exists
    try {
      await fs.access(walletStoragePath);
    } catch (error) {
      console.warn(
        `⚠️  Wallet storage directory not found: ${walletStoragePath}`
      );
      return wallets;
    }

    // Read all files in the directory
    const files = await fs.readdir(walletStoragePath);

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(walletStoragePath, file);
          const walletData = JSON.parse(await fs.readFile(filePath, 'utf8'));

          // Check if it's a Stellar wallet
          if (
            walletData.blockchain === 'STELLAR' &&
            walletData.publicKey &&
            walletData.privateKey
          ) {
            wallets.push({
              publicKey: walletData.publicKey,
              secretKey: walletData.privateKey,
              mnemonic: walletData.mnemonic,
            });
            console.log(
              `📄 Loaded Stellar wallet: ${walletData.publicKey.substring(
                0,
                8
              )}...`
            );
          }
        } catch (error) {
          console.warn(`⚠️  Error reading wallet file ${file}:`, error.message);
        }
      }
    }

    console.log(`📊 Loaded ${wallets.length} Stellar wallets from storage`);
    return wallets;
  } catch (error) {
    console.error('❌ Error loading wallets from storage:', error.message);
    return wallets;
  }
}

// Function to check account balance and determine if it should be emptied
async function checkAccountBalance(publicKey) {
  try {
    const accountExists = await checkAccountExists(publicKey);
    if (!accountExists) {
      return { shouldEmpty: false, reason: 'Account does not exist' };
    }

    const account = await server.loadAccount(publicKey);

    // Check XLM balance
    const xlmBalance = account.balances.find((b) => b.asset_type === 'native');
    const xlmAmount = parseFloat(xlmBalance.balance);

    // Check RAHAT balance
    const rahatBalance = account.balances.find(
      (b) =>
        b.asset_code === RAHAT_ASSET_CODE && b.asset_issuer === RAHAT_ISSUER
    );
    const rahatAmount = rahatBalance ? parseFloat(rahatBalance.balance) : 0;

    // Check if account has trustline
    const hasTrustlineResult = await hasTrustline(publicKey);

    // Determine if account should be emptied
    // Empty if: has RAHAT balance OR has trustline OR has more than 1.1 XLM (minimum reserve + some buffer)
    const shouldEmpty =
      rahatAmount > 0 || hasTrustlineResult || xlmAmount > 1.1;

    return {
      shouldEmpty,
      xlmBalance: xlmAmount,
      rahatBalance: rahatAmount,
      hasTrustline: hasTrustlineResult,
      reason: shouldEmpty
        ? `Has ${rahatAmount} RAHAT, ${xlmAmount} XLM, trustline: ${hasTrustlineResult}`
        : `Only has ${xlmAmount} XLM (minimum reserve)`,
    };
  } catch (error) {
    console.error(`❌ Error checking balance for ${publicKey}:`, error.message);
    return { shouldEmpty: false, reason: `Error: ${error.message}` };
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

// Get all trustlines for an account
async function getAllTrustlines(publicKey) {
  try {
    const accountExists = await checkAccountExists(publicKey);
    if (!accountExists) {
      return [];
    }

    const account = await server.loadAccount(publicKey);

    return account.balances.filter((balance) => {
      return (
        balance.asset_type === 'credit_alphanum4' ||
        balance.asset_type === 'credit_alphanum12'
      );
    });
  } catch (error) {
    console.error('Error getting trustlines:', error);
    return [];
  }
}

// Check if account has sub-entries (offers, data entries, etc.)
async function hasSubEntries(publicKey) {
  try {
    const accountExists = await checkAccountExists(publicKey);
    if (!accountExists) {
      return false;
    }

    // Check for offers
    try {
      const offers = await server
        .offers()
        .forAccount(publicKey)
        .limit(1)
        .call();
      if (offers.records && offers.records.length > 0) {
        console.log(`   📋 Found ${offers.records.length} offers`);
        return true;
      }
    } catch (offerError) {
      // Offers might not be accessible, continue
    }

    // Check for data entries
    try {
      const data = await server
        .accounts()
        .accountId(publicKey)
        .data()
        .limit(1)
        .call();
      if (data.records && data.records.length > 0) {
        console.log(`   📋 Found data entries`);
        return true;
      }
    } catch (dataError) {
      // Data might not be accessible, continue
    }

    // Check for signers (if more than 1, it's a sub-entry)
    try {
      const account = await server.loadAccount(publicKey);
      if (account.signers && account.signers.length > 1) {
        console.log(`   📋 Found multiple signers`);
        return true;
      }
    } catch (signerError) {
      // Continue
    }

    return false;
  } catch (error) {
    console.error('Error checking sub-entries:', error);
    return false;
  }
}

// Function to clear offers from an account
async function clearOffers(account, sourceKeypair) {
  const { publicKey } = account;
  console.log(`   🧹 Clearing offers for account: ${publicKey}`);

  try {
    // Get all offers for the account
    const offers = await server
      .offers()
      .forAccount(publicKey)
      .limit(200) // Get up to 200 offers
      .call();

    if (!offers.records || offers.records.length === 0) {
      console.log(`   ℹ️  No offers found to clear`);
      return { success: true, cleared: 0 };
    }

    console.log(`   📋 Found ${offers.records.length} offers to clear`);

    // Clear offers in batches (Stellar limit is 100 operations per transaction)
    const batchSize = 100;
    let clearedCount = 0;

    for (let i = 0; i < offers.records.length; i += batchSize) {
      const batch = offers.records.slice(i, i + batchSize);

      try {
        // Load current account state
        const sourceAccount = await server.loadAccount(publicKey);

        // Build transaction to clear offers
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: (await server.fetchBaseFee()).toString(),
          networkPassphrase,
        });

        // Add operations to delete each offer
        for (const offer of batch) {
          transaction.addOperation(
            StellarSdk.Operation.manageSellOffer({
              selling: new StellarSdk.Asset(
                offer.selling.asset_code,
                offer.selling.asset_issuer
              ),
              buying: new StellarSdk.Asset(
                offer.buying.asset_code,
                offer.buying.asset_issuer
              ),
              amount: '0',
              price: offer.price,
              offerId: offer.id,
            })
          );
        }

        // Set timeout and build transaction
        transaction.setTimeout(30);
        const builtTx = transaction.build();

        // Sign transaction
        builtTx.sign(sourceKeypair);

        // Submit transaction
        const result = await server.submitTransaction(builtTx);
        console.log(
          `   ✅ Cleared ${batch.length} offers. Tx hash: ${result.hash}`
        );
        clearedCount += batch.length;

        // Add delay between batches
        if (i + batchSize < offers.records.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `   ❌ Error clearing batch of offers:`,
          error.response?.data || error.message
        );
        return { success: false, cleared: clearedCount, error: error.message };
      }
    }

    console.log(`   ✅ Successfully cleared ${clearedCount} offers`);
    return { success: true, cleared: clearedCount };
  } catch (error) {
    console.error(`   ❌ Error clearing offers:`, error.message);
    return { success: false, cleared: 0, error: error.message };
  }
}

// Function to check if account has data entries
async function hasDataEntries(publicKey) {
  try {
    const data = await server
      .accounts()
      .accountId(publicKey)
      .data()
      .limit(1)
      .call();
    return data.records && data.records.length > 0;
  } catch (error) {
    return false;
  }
}

// Function to clear data entries from an account
async function clearDataEntries(account, sourceKeypair) {
  const { publicKey } = account;
  console.log(`   🧹 Clearing data entries for account: ${publicKey}`);

  try {
    // Get all data entries for the account
    const data = await server
      .accounts()
      .accountId(publicKey)
      .data()
      .limit(200) // Get up to 200 data entries
      .call();

    if (!data.records || data.records.length === 0) {
      console.log(`   ℹ️  No data entries found to clear`);
      return { success: true, cleared: 0 };
    }

    console.log(`   📋 Found ${data.records.length} data entries to clear`);

    // Clear data entries in batches (Stellar limit is 100 operations per transaction)
    const batchSize = 100;
    let clearedCount = 0;

    for (let i = 0; i < data.records.length; i += batchSize) {
      const batch = data.records.slice(i, i + batchSize);

      try {
        // Load current account state
        const sourceAccount = await server.loadAccount(publicKey);

        // Build transaction to clear data entries
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: (await server.fetchBaseFee()).toString(),
          networkPassphrase,
        });

        // Add operations to delete each data entry
        for (const dataEntry of batch) {
          transaction.addOperation(
            StellarSdk.Operation.manageData({
              name: dataEntry.key,
              value: null, // Setting to null removes the data entry
            })
          );
        }

        // Set timeout and build transaction
        transaction.setTimeout(30);
        const builtTx = transaction.build();

        // Sign transaction
        builtTx.sign(sourceKeypair);

        // Submit transaction
        const result = await server.submitTransaction(builtTx);
        console.log(
          `   ✅ Cleared ${batch.length} data entries. Tx hash: ${result.hash}`
        );
        clearedCount += batch.length;

        // Add delay between batches
        if (i + batchSize < data.records.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `   ❌ Error clearing batch of data entries:`,
          error.response?.data || error.message
        );
        return { success: false, cleared: clearedCount, error: error.message };
      }
    }

    console.log(`   ✅ Successfully cleared ${clearedCount} data entries`);
    return { success: true, cleared: clearedCount };
  } catch (error) {
    console.error(`   ❌ Error clearing data entries:`, error.message);
    return { success: false, cleared: 0, error: error.message };
  }
}

// Function to process account with payment only (fallback for complex accounts)
async function processAccountWithPaymentOnly(
  account,
  receiverPublicKey,
  forceClear = false
) {
  const { publicKey, secretKey } = account;
  console.log(`   💸 Processing account with payment only: ${publicKey}`);

  try {
    // Load account
    const sourceAccount = await server.loadAccount(publicKey);
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);

    // Check for sub-entries and try to clear them
    const hasSubEntriesResult = await hasSubEntries(publicKey);
    if (hasSubEntriesResult) {
      console.log(
        `   ⚠️  Account has sub-entries. Attempting to clear them before payment...`
      );

      // Try to clear offers
      const clearOffersResult = await clearOffers(account, sourceKeypair);
      if (!clearOffersResult.success) {
        console.log(
          `   ⚠️  Failed to clear offers: ${clearOffersResult.error}`
        );
      }

      // Try to clear data entries
      const clearDataResult = await clearDataEntries(account, sourceKeypair);
      if (!clearDataResult.success) {
        console.log(
          `   ⚠️  Failed to clear data entries: ${clearDataResult.error}`
        );
      }

      // Re-check for sub-entries
      const stillHasSubEntries = await hasSubEntries(publicKey);
      if (stillHasSubEntries) {
        if (forceClear) {
          console.log(
            `   ⚠️  Failed to clear all sub-entries, but force-clear is enabled. Proceeding anyway.`
          );
        } else {
          console.log(`   ❌ Failed to clear all sub-entries`);
          return {
            status: 'failed',
            publicKey,
            error: `Cannot process account with remaining sub-entries`,
          };
        }
      }

      // Reload account after clearing sub-entries
      sourceAccount = await server.loadAccount(publicKey);
    }

    // Check RAHAT balance
    const rahatBalance = sourceAccount.balances.find(
      (b) =>
        b.asset_code === RAHAT_ASSET_CODE && b.asset_issuer === RAHAT_ISSUER
    );
    const hasRahat = rahatBalance && parseFloat(rahatBalance.balance) > 0;

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
    }

    // Operation 2: Send remaining XLM (keep minimum reserve)
    const xlmBalance = sourceAccount.balances.find(
      (b) => b.asset_type === 'native'
    );
    const availableXlm = parseFloat(xlmBalance.balance) - 1.0; // Keep 1 XLM for reserve

    if (availableXlm > 0.00001) {
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
    }

    // Check if we have any operations to perform
    if (transaction.operations.length === 0) {
      console.log(`   ℹ️  No operations to perform for ${publicKey}`);
      return { status: 'skipped', publicKey, reason: 'No operations needed' };
    }

    // Set timeout and build transaction
    transaction.setTimeout(30);
    const builtTx = transaction.build();

    // Sign transaction
    builtTx.sign(sourceKeypair);

    // Submit transaction
    const result = await server.submitTransaction(builtTx);
    console.log(
      `   ✅ Account ${publicKey} processed with payment. Tx hash: ${result.hash}`
    );

    return {
      status: 'success',
      publicKey,
      txHash: result.hash,
      method: 'payment',
    };
  } catch (error) {
    console.error(
      `   ❌ Error processing ${publicKey} with payment:`,
      error.response?.data || error.message
    );

    // Log detailed error information
    if (error.response?.data?.extras?.result_codes) {
      const resultCodes = error.response.data.extras.result_codes;
      console.error(`   📋 Transaction Result Codes:`, resultCodes);

      if (resultCodes.operations) {
        console.error(`   🔍 Operation Results:`, resultCodes.operations);
      }
    }

    return { status: 'failed', publicKey, error: error.message };
  }
}

// Function to process a single account
async function processAccount(
  account,
  receiverPublicKey,
  useAccountMerge = true,
  forceClear = false
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

    // Check for sub-entries and handle them
    const hasSubEntriesResult = await hasSubEntries(publicKey);
    if (hasSubEntriesResult) {
      console.log(
        `   ⚠️  Account has sub-entries (offers/data). Attempting to clear them...`
      );

      // Try to clear offers first
      const clearOffersResult = await clearOffers(account, sourceKeypair);
      if (clearOffersResult.success) {
        console.log(
          `   ✅ Successfully cleared ${clearOffersResult.cleared} offers`
        );
      } else {
        console.log(
          `   ⚠️  Failed to clear offers: ${clearOffersResult.error}`
        );
      }

      // Try to clear data entries
      const clearDataResult = await clearDataEntries(account, sourceKeypair);
      if (clearDataResult.success) {
        console.log(
          `   ✅ Successfully cleared ${clearDataResult.cleared} data entries`
        );
      } else {
        console.log(
          `   ⚠️  Failed to clear data entries: ${clearDataResult.error}`
        );
      }

      // Re-check for sub-entries after clearing
      const stillHasSubEntries = await hasSubEntries(publicKey);
      if (stillHasSubEntries) {
        if (forceClear) {
          console.log(
            `   ⚠️  Account still has sub-entries after clearing attempts, but force-clear is enabled. Proceeding anyway.`
          );
        } else {
          console.log(
            `   ⚠️  Account still has sub-entries after clearing attempts. Using payment mode.`
          );
          return await processAccountWithPaymentOnly(
            account,
            receiverPublicKey,
            forceClear
          );
        }
      } else {
        console.log(
          `   ✅ All sub-entries cleared. Proceeding with account processing.`
        );
      }
    }

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

    // Operation 2: Remove trustlines
    const allTrustlines = await getAllTrustlines(publicKey);
    const rahatTrustline = allTrustlines.find(
      (tl) =>
        tl.asset_code === RAHAT_ASSET_CODE && tl.asset_issuer === RAHAT_ISSUER
    );

    if (useAccountMerge) {
      // For account merge, we need to remove ALL trustlines (regardless of balance)
      for (const trustline of allTrustlines) {
        const balance = parseFloat(trustline.balance);
        console.log(
          `   🔗 Removing trustline for ${trustline.asset_code}:${trustline.asset_issuer} (balance: ${balance}, limit: ${trustline.limit})`
        );
        transaction.addOperation(
          StellarSdk.Operation.changeTrust({
            asset: new StellarSdk.Asset(
              trustline.asset_code,
              trustline.asset_issuer
            ),
            limit: '0',
          })
        );
      }
    } else {
      // For payment only, just remove RAHAT trustline if it exists
      if (rahatTrustline) {
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

    // Check if we have any operations to perform
    if (transaction.operations.length === 0) {
      console.log(`   ℹ️  No operations to perform for ${publicKey}`);
      return { status: 'skipped', publicKey, reason: 'No operations needed' };
    }

    // Check if we have too many operations (Stellar limit is 100 operations per transaction)
    if (transaction.operations.length > 100) {
      console.log(
        `   ⚠️  Too many operations (${transaction.operations.length}). Using payment mode instead of merge.`
      );
      return await processAccountWithPaymentOnly(
        account,
        receiverPublicKey,
        forceClear
      );
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

    // Log detailed error information
    if (error.response?.data?.extras?.result_codes) {
      const resultCodes = error.response.data.extras.result_codes;
      console.error(`   📋 Transaction Result Codes:`, resultCodes);

      if (resultCodes.operations) {
        console.error(`   🔍 Operation Results:`, resultCodes.operations);
      }

      // Check if this is a merge-related error and fallback to payment mode
      if (
        useAccountMerge &&
        resultCodes.operations &&
        (resultCodes.operations.includes('op_has_sub_entries') ||
          resultCodes.operations.includes('op_no_trust') ||
          resultCodes.operations.includes('op_invalid_limit'))
      ) {
        console.log(
          `   🔄 Account merge failed. Falling back to payment mode...`
        );
        return await processAccountWithPaymentOnly(
          account,
          receiverPublicKey,
          forceClear
        );
      }
    }

    return { status: 'failed', publicKey, error: error.message };
  }
}

// Main function to process all accounts
async function emptyAccounts(
  walletStoragePath,
  receiverPublicKey,
  useAccountMerge = true,
  forceClear = false
) {
  try {
    console.log(`🚀 Starting account emptying process...`);
    console.log(`   Horizon Server: ${HORIZON_SERVER}`);
    console.log(
      `   Network: ${
        networkPassphrase === StellarSdk.Networks.PUBLIC ? 'MAINNET' : 'TESTNET'
      }`
    );
    console.log(`   RAHAT Asset: ${RAHAT_ASSET_CODE}:${RAHAT_ISSUER}`);
    console.log(`   Receiver: ${receiverPublicKey}`);
    console.log(`   Method: ${useAccountMerge ? 'Account Merge' : 'Payment'}`);
    if (forceClear) {
      console.log(
        `   Force Clear: Enabled (will attempt to clear all sub-entries)\n`
      );
    } else {
      console.log(
        `   Force Clear: Disabled (will skip accounts with sub-entries)\n`
      );
    }

    // Validate receiver public key
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(receiverPublicKey)) {
      throw new Error('Invalid receiver public key');
    }

    // Load wallets from storage
    const wallets = await loadWalletsFromStorage(walletStoragePath);
    if (wallets.length === 0) {
      throw new Error('No Stellar wallets found in storage');
    }

    console.log(`📊 Found ${wallets.length} Stellar wallets in storage\n`);

    // Check balances for all wallets
    console.log(`🔍 Checking balances for all wallets...\n`);
    const accountsToProcess = [];

    for (const wallet of wallets) {
      const balanceInfo = await checkAccountBalance(wallet.publicKey);
      console.log(
        `   ${wallet.publicKey.substring(0, 8)}...: ${balanceInfo.reason}`
      );

      if (balanceInfo.shouldEmpty) {
        accountsToProcess.push({
          ...wallet,
          balanceInfo,
        });
      }
    }

    if (accountsToProcess.length === 0) {
      console.log(
        `\n✅ No accounts need to be emptied. All accounts have only minimum balance.`
      );
      return [];
    }

    console.log(
      `\n📊 Found ${accountsToProcess.length} accounts that need to be emptied:\n`
    );

    // Process accounts sequentially
    const results = [];
    for (const account of accountsToProcess) {
      console.log(`\n🔍 Processing account: ${account.publicKey}`);
      console.log(`   Balance Info: ${account.balanceInfo.reason}`);

      const result = await processAccount(
        account,
        receiverPublicKey,
        useAccountMerge,
        forceClear
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
  --merge        Use account merge (default) - deletes account and transfers all XLM
  --payment      Use payment only - keeps account alive with minimum balance
  --force-clear  Force clearing of sub-entries (offers/data) even if it might fail
  --help         Show this help message

Environment Variables:
  HORIZON_SERVER        Stellar horizon server (default: https://horizon.stellar.org)
  ASSET_CODE            Asset code (default: RAHAT)
  ASSET_ISSUER          Asset issuer address
  WALLET_STORAGE_PATH   Path to wallet storage directory (default: ./wallet_storage)

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

  # Force clear sub-entries before emptying
  node empty-stellar-account.js --merge --force-clear

  # With custom wallet storage path
  WALLET_STORAGE_PATH=/path/to/wallet/storage node empty-stellar-account.js --merge

  # With custom horizon server
  HORIZON_SERVER=https://horizon-testnet.stellar.org node empty-stellar-account.js --merge
`);
}

// Handle command line arguments
const args = process.argv.slice(2);
const useAccountMerge = !args.includes('--payment');
const forceClear = args.includes('--force-clear');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  showUsage();
  process.exit(0);
}

// Example usage
const walletStoragePath = process.env.WALLET_STORAGE_PATH || './wallet_storage';
const receiverPublicKey =
  'GD7M57OPBXNH7UBOUXU2MMFSQDWCUWDKLGN3FKYSRR4GG5IF2RK3KXUI'; // Replace with actual receiver public key

emptyAccounts(walletStoragePath, receiverPublicKey, useAccountMerge, forceClear)
  .then(() => console.log('\n🎉 All accounts processed'))
  .catch((error) =>
    console.error('❌ Failed to process accounts:', error.message)
  );
