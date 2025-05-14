import axios from 'axios';
import readline from 'readline';
import authenticate from './01_authenticate';

const BASE_URL = process.env.TRIPLEA_BASE_URL || 'https://api.triple-a.io';
const API_ID = process.env.TRIPLEA_API_ID || '';

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

async function getExchangeRate(crypto = 'BTC', fiat = 'USD') {
  const accessToken = await authenticate();
  try {
    const url = `${BASE_URL}/api/v1/exchange_rate/${API_ID}/${crypto}/${fiat}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(`Exchange Rate ${crypto}/${fiat}:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error('Exchange rate fetch failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  (async () => {
    const crypto = await askQuestion('Crypto currency (default BTC): ') || 'BTC';
    const fiat = await askQuestion('Fiat currency (default USD): ') || 'USD';
    await getExchangeRate(crypto, fiat);
  })();
}

export default getExchangeRate;
