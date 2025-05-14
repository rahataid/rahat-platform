import axios from 'axios';
import readline from 'readline';
import authenticate from './01_authenticate';

const BASE_URL = process.env.TRIPLEA_BASE_URL || 'https://api.triple-a.io';

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

async function checkPayoutStatus(payoutReference: string) {
  const accessToken = await authenticate();
  try {
    const url = `${BASE_URL}/api/v1/payout/withdraw/${payoutReference}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('Payout Status:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Check payout status failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  (async () => {
    const payoutReference = await askQuestion('Payout reference: ');
    if (!payoutReference) {
      console.error('Payout reference is required.');
      process.exit(1);
    }
    await checkPayoutStatus(payoutReference);
  })();
}

export default checkPayoutStatus;
