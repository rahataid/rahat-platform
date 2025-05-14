import axios from 'axios';
import 'dotenv/config';
import fs from 'fs';
import * as readline from 'readline';
import authenticate from './01_authenticate';
import { logger } from './logger';

const BASE_URL = process.env.TRIPLEA_BASE_URL || 'https://api.triple-a.io';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans.trim()); }));
}

async function promptValidated(query: string, validate: (val: string) => boolean, errorMsg: string): Promise<string> {
  while (true) {
    const ans = await askQuestion(query);
    if (validate(ans)) return ans;
    console.log(errorMsg);
  }
}

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}
function isPositiveNumber(val: string): boolean {
  return !isNaN(Number(val)) && Number(val) > 0;
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function getConfigArg(): string | undefined {
  const idx = process.argv.indexOf('--config');
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

async function runCryptoFlow(config: any, accessToken: string) {
  // 1. Get payout details
  let payout: any = config.payout || {};
  if (!payout.email) payout.email = await promptValidated('Recipient email: ', isValidEmail, 'Invalid email format.');
  if (!payout.withdraw_currency) payout.withdraw_currency = await promptValidated('Withdraw currency (default USD): ', v => v.length > 0, 'Withdraw currency is required.');
  if (!payout.withdraw_amount) payout.withdraw_amount = await promptValidated('Withdraw amount: ', isPositiveNumber, 'Amount must be a positive number.');
  if (!payout.crypto_currency) payout.crypto_currency = await promptValidated('Crypto currency (default BTC): ', v => v.length > 0, 'Crypto currency is required.');
  if (!payout.address) payout.address = await promptValidated('Recipient crypto address: ', v => v.length > 0, 'Crypto address is required.');
  // 2. Create payout
  let payout_reference = '';
  try {
    logger.info({
      action: 'POST /api/v2/payout/withdraw/local/crypto/direct',
      payload: payout
    });
    const resp = await axios.post(
      `${BASE_URL}/api/v2/payout/withdraw/local/crypto/direct`,
      {
        merchant_key: process.env.TRIPLEA_MERCHANT_KEY,
        email: payout.email,
        withdraw_currency: payout.withdraw_currency,
        withdraw_amount: payout.withdraw_amount,
        crypto_currency: payout.crypto_currency,
        remarks: payout.remarks || 'Commission payout',
        notify_url: process.env.TRIPLEA_NOTIFY_URL,
        notify_secret: process.env.TRIPLEA_NOTIFY_SECRET,
        address: payout.address,
        sandbox: process.env.TRIPLEA_SANDBOX === 'true',
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    logger.info({
      action: 'Response',
      status: resp.status,
      data: resp.data
    });
    payout_reference = resp.data.payout_reference;
    if (!payout_reference) throw new Error('No payout_reference returned');
    console.log('Payout created:', payout_reference);
  } catch (e: any) {
    logger.error({
      action: 'Create payout failed',
      status: e.response?.status,
      data: e.response?.data,
      message: e.message
    });
    console.error('Create payout failed:', e.response?.data || e.message);
    process.exit(1);
  }
  // 3. Check payout status
  let payoutStatus: any = {};
  try {
    logger.info(`GET /api/v2/payout/withdraw/status/${payout_reference}`);
    const resp = await axios.get(
      `${BASE_URL}/api/v2/payout/withdraw/status/${payout_reference}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    payoutStatus = resp.data;
    logger.info(`Response: ${JSON.stringify(resp.data)}`);
    console.log('Payout status:', payoutStatus);
  } catch (e: any) {
    logger.error(`Get payout status failed: ${e.response?.data || e.message}`);
    console.error('Get payout status failed:', e.response?.data || e.message);
    process.exit(1);
  }
  // Save results
  const result = { payout_reference, payoutStatus };
  fs.writeFileSync('result.json', JSON.stringify(result, null, 2));
  logger.info('All done! Results saved to result.json');
  console.log('All done! Results saved to result.json');
}

async function runRegulatedFlow(config: any, accessToken: string) {
  // 1. Sender type selection
  let senderType = config.senderType;
  if (!senderType) {
    senderType = await promptValidated('Sender type (individual/company): ', v => ['individual', 'company'].includes(v), 'Enter "individual" or "company".');
  }
  // 1. Create Sender
  let sender: any = {};
  if (config.sender) {
    sender = config.sender;
  } else {
    if (senderType === 'company') {
      sender.company_name = await promptValidated('Company name: ', v => v.length > 0, 'Company name is required.');
      sender.registration_number = await promptValidated('Registration number: ', v => v.length > 0, 'Registration number is required.');
      sender.country = await promptValidated('Company country (ISO code, e.g. US): ', v => v.length === 2, 'Country code must be 2 letters.');
      sender.email = await promptValidated('Company email: ', isValidEmail, 'Invalid email format.');
    } else {
      sender.first_name = await promptValidated('Sender first name: ', v => v.length > 0, 'First name is required.');
      sender.last_name = await promptValidated('Sender last name: ', v => v.length > 0, 'Last name is required.');
      sender.email = await promptValidated('Sender email: ', isValidEmail, 'Invalid email format.');
      sender.country = await promptValidated('Sender country (ISO code, e.g. US): ', v => v.length === 2, 'Country code must be 2 letters.');
      sender.date_of_birth = await promptValidated('Sender date of birth (YYYY-MM-DD): ', isValidDate, 'Date must be in YYYY-MM-DD format.');
    }
  }
  let sender_id = '';
  try {
    let endpoint = senderType === 'company' ? '/api/v2/companies' : '/api/v2/individuals';
    logger.info(`POST ${endpoint}: ${JSON.stringify(sender)}`);
    const resp = await axios.post(`${BASE_URL}${endpoint}`, sender, { headers: { Authorization: `Bearer ${accessToken}` } });
    logger.info(`Response: ${JSON.stringify(resp.data)}`);
    sender_id = resp.data.id || resp.data.sender_id || resp.data.data?.id;
    if (!sender_id) throw new Error('No sender_id returned');
    console.log('Sender created:', sender_id);
  } catch (e: any) {
    logger.error(`Create sender failed: ${e.response?.data || e.message}`);
    console.error('Create sender failed:', e.response?.data || e.message);
    process.exit(1);
  }
  // 2. Upload KYC
  let kyc: any = (config.sender && config.sender.kyc) ? config.sender.kyc : {};
  if (!kyc.type) kyc.type = await promptValidated('KYC document type (e.g. passport, id_card): ', v => v.length > 0, 'Document type is required.');
  if (!kyc.file_path) kyc.file_path = await promptValidated('Path to KYC document file: ', v => v.length > 0 && fileExists(v), 'File path is required and file must exist.');
  const FormData = require('form-data');
  const form = new FormData();
  form.append('sender_id', sender_id);
  form.append('type', kyc.type);
  form.append('file', fs.createReadStream(kyc.file_path));
  try {
    logger.info(`POST /api/v2/documents: sender_id=${sender_id}, type=${kyc.type}, file=${kyc.file_path}`);
    const resp = await axios.post(`${BASE_URL}/api/v2/documents`, form, { headers: { ...form.getHeaders(), Authorization: `Bearer ${accessToken}` } });
    logger.info(`Response: ${JSON.stringify(resp.data)}`);
    console.log('KYC uploaded:', resp.data);
  } catch (e: any) {
    logger.error(`Upload KYC failed: ${e.response?.data || e.message}`);
    console.error('Upload KYC failed:', e.response?.data || e.message);
    process.exit(1);
  }
  // 3. Recipient type selection
  let recipientType = config.recipientType;
  if (!recipientType) {
    recipientType = await promptValidated('Recipient type (individual/company): ', v => ['individual', 'company'].includes(v), 'Enter "individual" or "company".');
  }
  // 3. Create Recipient
  let recipient: any = {};
  if (config.recipient) {
    recipient = config.recipient;
  } else {
    if (recipientType === 'company') {
      recipient.company_name = await promptValidated('Company name: ', v => v.length > 0, 'Company name is required.');
      recipient.registration_number = await promptValidated('Registration number: ', v => v.length > 0, 'Registration number is required.');
      recipient.country = await promptValidated('Company country (ISO code, e.g. US): ', v => v.length === 2, 'Country code must be 2 letters.');
      recipient.email = await promptValidated('Company email: ', isValidEmail, 'Invalid email format.');
    } else {
      recipient.first_name = await promptValidated('Recipient first name: ', v => v.length > 0, 'First name is required.');
      recipient.last_name = await promptValidated('Recipient last name: ', v => v.length > 0, 'Last name is required.');
      recipient.email = await promptValidated('Recipient email: ', isValidEmail, 'Invalid email format.');
      recipient.country = await promptValidated('Recipient country (ISO code, e.g. US): ', v => v.length === 2, 'Country code must be 2 letters.');
      recipient.date_of_birth = await promptValidated('Recipient date of birth (YYYY-MM-DD): ', isValidDate, 'Date must be in YYYY-MM-DD format.');
    }
  }
  let recipient_id = '';
  try {
    let endpoint = recipientType === 'company' ? '/api/v2/companies' : '/api/v2/individuals';
    logger.info(`POST ${endpoint}: ${JSON.stringify(recipient)}`);
    const resp = await axios.post(`${BASE_URL}${endpoint}`, recipient, { headers: { Authorization: `Bearer ${accessToken}` } });
    logger.info(`Response: ${JSON.stringify(resp.data)}`);
    recipient_id = resp.data.id || resp.data.recipient_id || resp.data.data?.id;
    if (!recipient_id) throw new Error('No recipient_id returned');
    console.log('Recipient created:', recipient_id);
  } catch (e: any) {
    logger.error(`Create recipient failed: ${e.response?.data || e.message}`);
    console.error('Create recipient failed:', e.response?.data || e.message);
    process.exit(1);
  }
  // 4. Add Destination Account
  let dest: any = config.destination_account || {};
  if (!dest.type) dest.type = await promptValidated('Account type (bank_account, digital_wallet): ', v => v.length > 0, 'Account type is required.');
  if (!dest.account_number) dest.account_number = await promptValidated('Account number: ', v => v.length > 0, 'Account number is required.');
  if (dest.bank_code === undefined) dest.bank_code = await askQuestion('Bank code (if applicable, else leave blank): ');
  if (!dest.currency) dest.currency = await promptValidated('Currency (e.g. USD): ', v => v.length > 0, 'Currency is required.');
  let destination_account_id = '';
  try {
    logger.info(`POST /api/v2/destination-accounts: ${JSON.stringify(dest)}`);
    const resp = await axios.post(`${BASE_URL}/api/v2/destination-accounts`, {
      recipient_id,
      type: dest.type,
      account_number: dest.account_number,
      bank_code: dest.bank_code || undefined,
      currency: dest.currency,
    }, { headers: { Authorization: `Bearer ${accessToken}` } });
    logger.info(`Response: ${JSON.stringify(resp.data)}`);
    destination_account_id = resp.data.id || resp.data.destination_account_id || resp.data.data?.id;
    if (!destination_account_id) throw new Error('No destination_account_id returned');
    console.log('Destination account added:', destination_account_id);
  } catch (e: any) {
    logger.error(`Add destination account failed: ${e.response?.data || e.message}`);
    console.error('Add destination account failed:', e.response?.data || e.message);
    process.exit(1);
  }
  // 5. Prepare Transfer
  let transfer: any = config.transfer || {};
  if (!transfer.amount) transfer.amount = await promptValidated('Amount: ', isPositiveNumber, 'Amount must be a positive number.');
  if (!transfer.currency) transfer.currency = await promptValidated('Currency (e.g. USD): ', v => v.length > 0, 'Currency is required.');
  let transfer_id = '';
  try {
    logger.info(`POST /api/v2/transfers: ${JSON.stringify({ sender_id, recipient_id, destination_account_id, ...transfer })}`);
    const resp = await axios.post(`${BASE_URL}/api/v2/transfers`, {
      sender_id,
      recipient_id,
      destination_account_id,
      amount: transfer.amount,
      currency: transfer.currency,
    }, { headers: { Authorization: `Bearer ${accessToken}` } });
    logger.info(`Response: ${JSON.stringify(resp.data)}`);
    transfer_id = resp.data.id || resp.data.transfer_id || resp.data.data?.id;
    if (!transfer_id) throw new Error('No transfer_id returned');
    console.log('Transfer prepared:', transfer_id);
  } catch (e: any) {
    logger.error(`Prepare transfer failed: ${e.response?.data || e.message}`);
    console.error('Prepare transfer failed:', e.response?.data || e.message);
    process.exit(1);
  }
  // 6. Confirm Transfer
  try {
    logger.info(`POST /api/v2/transfers/${transfer_id}/confirm`);
    const resp = await axios.post(`${BASE_URL}/api/v2/transfers/${transfer_id}/confirm`, {}, { headers: { Authorization: `Bearer ${accessToken}` } });
    logger.info(`Response: ${JSON.stringify(resp.data)}`);
    console.log('Transfer confirmed:', resp.data);
  } catch (e: any) {
    logger.error(`Confirm transfer failed: ${e.response?.data || e.message}`);
    console.error('Confirm transfer failed:', e.response?.data || e.message);
    process.exit(1);
  }
  // 7. Get Transfer Status
  let transferStatus: any = {};
  try {
    logger.info(`GET /api/v2/transfers/${transfer_id}`);
    const resp = await axios.get(`${BASE_URL}/api/v2/transfers/${transfer_id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    transferStatus = resp.data;
    logger.info(`Response: ${JSON.stringify(resp.data)}`);
    console.log('Transfer status:', transferStatus);
  } catch (e: any) {
    logger.error(`Get transfer status failed: ${e.response?.data || e.message}`);
    console.error('Get transfer status failed:', e.response?.data || e.message);
    process.exit(1);
  }
  // Save results
  const result = { sender_id, recipient_id, destination_account_id, transfer_id, transferStatus };
  fs.writeFileSync('result.json', JSON.stringify(result, null, 2));
  logger.info('All done! Results saved to result.json');
  console.log('All done! Results saved to result.json');
}

async function main() {
  const configPath = getConfigArg();
  let config: any = {};
  if (configPath) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      logger.error(`Failed to read config file: ${e}`);
      console.error('Failed to read config file:', e);
      process.exit(1);
    }
  }
  // Flow selector
  let flow = config.flow;
  if (!flow) {
    flow = await promptValidated('Select payout flow (crypto/regulated): ', v => ['crypto', 'regulated'].includes(v), 'Enter "crypto" or "regulated".');
  }
  const accessToken = await authenticate();
  if (flow === 'crypto') {
    await runCryptoFlow(config, accessToken);
  } else {
    await runRegulatedFlow(config, accessToken);
  }
}

main();
