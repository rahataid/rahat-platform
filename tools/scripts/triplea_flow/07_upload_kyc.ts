import axios from 'axios';
import 'dotenv/config';
import * as FormData from 'form-data';
import * as fs from 'fs';
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

async function uploadKyc() {
  const accessToken = await authenticate();
  const senderId = await promptValidated('Sender ID: ', v => v.length > 0, 'Sender ID is required.');
  const docType = await promptValidated('Document type (e.g. passport, id_card): ', v => v.length > 0, 'Document type is required.');
  const filePath = await promptValidated('Path to document file: ', v => v.length > 0 && fs.existsSync(v), 'File path is required and file must exist.');

  const form = new FormData();
  form.append('sender_id', senderId);
  form.append('type', docType);
  form.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v2/documents`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log('KYC document uploaded:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Upload KYC failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  uploadKyc();
}
