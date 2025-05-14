import axios from 'axios';
import 'dotenv/config';
import * as readline from 'readline';
import authenticate from './01_authenticate';

const BASE_URL = process.env.TRIPLEA_BASE_URL || 'https://api.triple-a.io';
const MERCHANT_KEY = process.env.TRIPLEA_MERCHANT_KEY || '';
const NOTIFY_URL = process.env.TRIPLEA_NOTIFY_URL || 'https://your-backend.com/triplea/webhook';
const NOTIFY_SECRET = process.env.TRIPLEA_NOTIFY_SECRET || 'yourNotifySecret';

interface PayoutParams {
  email: string;
  withdraw_currency?: string;
  withdraw_amount?: number;
  crypto_currency?: string;
  address: string;
  remarks?: string;
}

async function createPayout({
  email,
  withdraw_currency = 'USD',
  withdraw_amount = 1,
  crypto_currency = 'BTC',
  address,
  remarks = 'Commission payout',
}: PayoutParams) {
  const accessToken = await authenticate();
  const isSandbox = process.env.TRIPLEA_SANDBOX === 'true';
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v2/payout/withdraw/local/crypto/direct`,
      {
        merchant_key: MERCHANT_KEY,
        email,
        withdraw_currency,
        withdraw_amount,
        crypto_currency,
        remarks,
        notify_url: NOTIFY_URL,
        notify_secret: NOTIFY_SECRET,
        address,
        sandbox: isSandbox,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log('Payout Reference:', response.data.payout_reference);
    return response.data;
  } catch (error: any) {
    console.error('Create payout failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

if (require.main === module) {
  (async () => {
    const email = await askQuestion('Recipient email: ');
    const withdraw_currency = await askQuestion('Withdraw currency (default USD): ') || 'USD';
    const withdraw_amount_str = await askQuestion('Withdraw amount (default 1): ');
    const withdraw_amount = Number(withdraw_amount_str) || 1;
    const crypto_currency = await askQuestion('Crypto currency (default BTC): ') || 'BTC';
    const address = await askQuestion('Recipient crypto address: ');
    if (!email || !address) {
      console.error('Email and address are required.');
      process.exit(1);
    }
    await createPayout({
      email,
      withdraw_currency,
      withdraw_amount,
      crypto_currency,
      address,
    });
  })();
}

export default createPayout;
