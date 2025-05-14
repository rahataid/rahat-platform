import axios from 'axios';
import 'dotenv/config';
import * as readline from 'readline';
import authenticate from './01_authenticate';

const BASE_URL = process.env.TRIPLEA_BASE_URL || 'https://api.triple-a.io';

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

async function promptValidated(query: string, validate: (val: string) => boolean, errorMsg: string): Promise<string> {
    while (true) {
        const ans = await askQuestion(query);
        if (validate(ans)) return ans;
        console.log(errorMsg);
    }
}

async function addDestinationAccount() {
    const accessToken = await authenticate();
    const recipientId = await promptValidated('Recipient ID: ', v => v.length > 0, 'Recipient ID is required.');
    const accountType = await promptValidated('Account type (bank_account, digital_wallet): ', v => v.length > 0, 'Account type is required.');
    const accountNumber = await promptValidated('Account number: ', v => v.length > 0, 'Account number is required.');
    const bankCode = await askQuestion('Bank code (if applicable, else leave blank): ');
    const currency = await promptValidated('Currency (e.g. USD): ', v => v.length > 0, 'Currency is required.');

    try {
        const response = await axios.post(
            `${BASE_URL}/api/v2/destination-accounts`,
            {
                recipient_id: recipientId,
                type: accountType,
                account_number: accountNumber,
                bank_code: bankCode || undefined,
                currency,
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        console.log('Destination account added:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Add destination account failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    addDestinationAccount();
}
