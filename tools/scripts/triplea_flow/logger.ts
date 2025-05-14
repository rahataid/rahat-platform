import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(__dirname, 'payout_flow.log');

function timestamp() {
  return new Date().toISOString();
}

function safeStringify(obj: any) {
  if (typeof obj === 'string') return obj;
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export const logger = {
  log: (msg: any) => {
    fs.appendFileSync(LOG_FILE, `[${timestamp()}] LOG: ${safeStringify(msg)}\n`);
  },
  info: (msg: any) => {
    fs.appendFileSync(LOG_FILE, `[${timestamp()}] INFO: ${safeStringify(msg)}\n`);
  },
  error: (msg: any) => {
    fs.appendFileSync(LOG_FILE, `[${timestamp()}] ERROR: ${safeStringify(msg)}\n`);
  },
};
