import fs from 'fs';

const LOG_FILE = 'payout_flow.log';

function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  log: (msg: string) => {
    fs.appendFileSync(LOG_FILE, `[${timestamp()}] LOG: ${msg}\n`);
  },
  info: (msg: string) => {
    fs.appendFileSync(LOG_FILE, `[${timestamp()}] INFO: ${msg}\n`);
  },
  error: (msg: string) => {
    fs.appendFileSync(LOG_FILE, `[${timestamp()}] ERROR: ${msg}\n`);
  },
};
