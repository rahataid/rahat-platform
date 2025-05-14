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

function isPositiveNumber(val: string): boolean {
  return !isNaN(Number(val)) && Number(val) > 0;
}

async function prepareTransfer() {
  const accessToken = await authenticate();
  const senderId = await promptValidated('Sender ID: ', v => v.length > 0, 'Sender ID is required.');
  const recipientId = await promptValidated('Recipient ID: ', v => v.length > 0, 'Recipient ID is required.');
  const destinationAccountId = await promptValidated('Destination Account ID: ', v => v.length > 0, 'Destination Account ID is required.');
  const amount = await promptValidated('Amount: ', isPositiveNumber, 'Amount must be a positive number.');
  const currency = await promptValidated('Currency (e.g. USD): ', v => v.length > 0, 'Currency is required.');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v2/transfers`,
      {
        sender_id: senderId,
        recipient_id: recipientId,
        destination_account_id: destinationAccountId,
        amount,
        currency,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log('Transfer prepared:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Prepare transfer failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  prepareTransfer();
}
