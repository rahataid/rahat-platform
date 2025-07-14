require('dotenv').config({ path: __dirname + '/.env.stellar' });

const { Horizon, Networks } = require('@stellar/stellar-sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getBeneficiaryWallets, saveJsonFile } = require('./common');

const NETWORK = process.env.NETWORK || 'TESTNET';

// Stellar server based on network environment
const serverUrl =
  NETWORK === 'MAINNET'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
const networkPassphrase =
  NETWORK === 'MAINNET' ? Networks.PUBLIC : Networks.TESTNET;
const horizonServer = new Horizon.Server(serverUrl);

const main = async () => {
  const walletAddresses = await getBeneficiaryWallets();
  console.log('Wallet Addresses:', walletAddresses);

  const accountDetails = [];

  for (const address of walletAddresses) {
    try {
      const account = await horizonServer.loadAccount(address);
      const { balance } = account.balances.find(
        (b) => b.asset_type === 'native'
      );

      const accountInfo = {
        address: address,
        exists: true,
        balance: balance,
      };

      accountDetails.push(accountInfo);
      console.log(
        `Account ${address} exists with with balance: ${balance} XLM `
      );
    } catch (error) {
      if (error) {
        const accountInfo = {
          address: address,
          exists: false,
          balance: null,
        };

        accountDetails.push(accountInfo);
        console.warn(`Account ${address} does not exist.`);
      } else {
        console.error(`Error checking account ${address}:`, error);
      }
    }
  }

  saveJsonFile(
    accountDetails,
    path.join(__dirname, './.data/account-details.json')
  );

  // Calculate summary statistics
  const existingAccounts = accountDetails.filter((account) => account.exists);
  const nonExistingAccounts = accountDetails.filter(
    (account) => !account.exists
  );

  console.log('\n=== SUMMARY ===');
  console.log(`Total accounts checked: ${accountDetails.length}`);
  console.log(`Accounts that exist: ${existingAccounts.length}`);
  console.log(`Accounts that don't exist: ${nonExistingAccounts.length}`);
  console.log('================\n');
};

main()
  .then(() => console.log('Account check completed.'))
  .catch((error) => console.error('Error in account check:', error));
