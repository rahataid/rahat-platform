require('dotenv').config({ path: __dirname + '/.env.stellar' });

const { Horizon, Networks } = require('@stellar/stellar-sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getBeneficiaryWallets, saveJsonFile } = require('./common');

const NETWORK = process.env.NETWORK || 'TESTNET';

// Stellar server based on network environment
const serverUrl = NETWORK === 'MAINNET' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
const networkPassphrase = NETWORK === 'MAINNET' ? Networks.PUBLIC : Networks.TESTNET;
const horizonServer = new Horizon.Server(serverUrl);


const main = async () => {
    // const walletAddresses = [
    //     'GACYQSJSJDADZ4WDFS5GJ5SG7MMUYQKXT2CDB2O3AJFPINRLVP3OA4M2',
    //     'GDLX5GEBWEKJW4E6QYQJEC23PRNXFRV6KC5PK5DYK7P6IP4GI53RJ6BV',
    //     'GDMSVEODC3E6F2I4M74I5L34RF2HGEOZYPHBQJK56X46BOGJQC4PZDBV',
    //     'GBWMX7HM46762OSYM5BC7VKF6IHD65AYMTYUWWFBXKDO4AJE67H7HDVF',
    //     'GCWT6CZ5N2X5KSVYPWNKWNASWHSY62GMGUGFAGAAP2SLM24UVBGPA6VD',
    //     'GBTDJYZAYVLDIL7V4HECHTFD7JYGRRMWVVXVGY7ABGGEX4TMMZPGAMQL',
    //     'GCPQ2BGM3ABAS2NTOLNCUAYNMGROWMSSW6UCPOU6OFWSIZM4SDQGHT4Z',
    //     'GBGDWWXH2TGCVAXWQW5VUIKZWGBLLQXLP4XWEGQKGQAABS6R6AVN3FEQ',
    //     'GCX2W7XGCVVKZ5E6CU4M2WTRKFCCSXRZNL5TAH4KK6D5BS3VRHXBINJM'
    // ]
    const walletAddresses = await getBeneficiaryWallets();

    console.log('Wallet Addresses:', walletAddresses);
    console.log('found wallet addresses:', walletAddresses.length);

    const accountDetails = [];

    for (const address of walletAddresses) {
        try {
            const account = await horizonServer.loadAccount(address);
            const { balance } = account.balances.find(b => b.asset_type === 'native');

            const accountInfo = {
                address: address,
                exists: true,
                balance: balance
            };

            accountDetails.push(accountInfo);
            console.log(`Account ${address} exists with with balance: ${balance} XLM `);
        } catch (error) {
            if (error) {
                const accountInfo = {
                    address: address,
                    exists: false,
                    balance: null
                };

                accountDetails.push(accountInfo);
                console.warn(`Account ${address} does not exist.`);
            } else {
                console.error(`Error checking account ${address}:`, error);
            }
        }
    }

    saveJsonFile(accountDetails, path.join(__dirname, './.data/account-details.json'));
}

main()
    .then(() => console.log('Account check completed.'))
    .catch(error => console.error('Error in account check:', error));

