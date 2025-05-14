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

async function confirmTransfer() {
  const accessToken = await authenticate();
  const transferId = await promptValidated('Transfer ID: ', v => v.length > 0, 'Transfer ID is required.');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v2/transfers/${transferId}/confirm`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log('Transfer confirmed:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Confirm transfer failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  confirmTransfer();
}
