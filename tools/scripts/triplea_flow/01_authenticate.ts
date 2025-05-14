import axios from 'axios';
import 'dotenv/config';

const BASE_URL = process.env.TRIPLEA_BASE_URL || 'https://api.triple-a.io';
const CLIENT_ID = process.env.TRIPLEA_CLIENT_ID;
const CLIENT_SECRET = process.env.TRIPLEA_CLIENT_SECRET;

console.log('TRIPLEA_CLIENT_ID:', CLIENT_ID);
console.log('TRIPLEA_CLIENT_SECRET:', CLIENT_SECRET);
console.log('TRIPLEA_BASE_URL:', BASE_URL);

async function authenticate() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v2/oauth/token`,
      new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        grant_type: 'client_credentials',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    console.log('Access Token:', response.data.access_token);
    return response.data.access_token;
  } catch (error: any) {
    console.error('Authentication failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  authenticate();
}

export default authenticate;