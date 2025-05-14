import axios from 'axios';
import authenticate from './01_authenticate';

const BASE_URL = process.env.TRIPLEA_BASE_URL || 'https://api.triple-a.io';

async function checkBalance() {
  const accessToken = await authenticate();
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/payout/balances`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('Balances:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('Balance check failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkBalance();
}

export default checkBalance;
