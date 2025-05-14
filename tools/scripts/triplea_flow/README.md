# Triple-A Payout Flow Scripts

## Flow Overview

There are **two main payout flows** supported by these scripts:

### 1. Crypto Payout Flow

- **Purpose:** Send cryptocurrency (e.g., BTC, ETH) directly to a recipient's crypto wallet address.
- **Scripts:**
  - `01_authenticate.ts`
  - `02_check_balance.ts`
  - `04_create_payout.ts`
  - `05_check_payout_status.ts`
- **Master script:** `master_payout_flow.ts` (choose 'crypto' flow)
- **Key:** No sender/recipient KYC steps, direct to crypto address.

### 2. Regulated (Bank/Fiat/Remittance) Flow

- **Purpose:** Send fiat or regulated payouts to a recipient's bank account or digital wallet, with full KYC/AML compliance.
- **Scripts:**
  - `06_create_sender.ts`
  - `07_upload_kyc.ts`
  - `08_create_recipient.ts`
  - `09_add_destination_account.ts`
  - `10_prepare_transfer.ts`
  - `11_confirm_transfer.ts`
  - `12_get_transfer_status.ts`
  - `master_payout_flow.ts` (choose 'regulated' flow)
- **Key:** Requires sender/recipient creation, KYC, and destination account setup.

---

## Using the Master Script

Run the master script and select the flow type when prompted, or specify in your config file:

```sh
npx ts-node master_payout_flow.ts
# or
npx ts-node master_payout_flow.ts --config myflow.json
```

- For **crypto payouts**, select `crypto` when prompted (or set `"flow": "crypto"` in your config).
- For **regulated payouts**, select `regulated` (or set `"flow": "regulated"` in your config).

---

## Prerequisites

- Node.js (v16+ recommended)
- TypeScript (`npm install -g ts-node typescript`)
- `axios` package (`npm install axios`)

## Environment Variables

Set these in your shell or a `.env` file (use [dotenv](https://www.npmjs.com/package/dotenv) if needed):

- `TRIPLEA_BASE_URL` (default: `https://api.triple-a.io`)
- `TRIPLEA_CLIENT_ID` (your Triple-A client ID)
- `TRIPLEA_CLIENT_SECRET` (your Triple-A client secret)
- `TRIPLEA_MERCHANT_KEY` (your Triple-A merchant key)
- `TRIPLEA_NOTIFY_URL` (your webhook endpoint, e.g. `https://your-backend.com/triplea/webhook`)
- `TRIPLEA_NOTIFY_SECRET` (your webhook secret)
- `TRIPLEA_API_ID` (API ID for exchange rate queries)

## Scripts & Usage

### 1. Authenticate

Get an access token from Triple-A.

```sh
npx ts-node 01_authenticate.ts
```

### 2. Check Balance

Check your available payout balances.

```sh
npx ts-node 02_check_balance.ts
```

### 3. Get Exchange Rate

Fetch the exchange rate for a crypto/fiat pair (default: BTC/USD).

```sh
npx ts-node 03_get_exchange_rate.ts BTC USD
```

### 4. Create Payout

Initiate a direct payout to a recipient's crypto address.

```sh
npx ts-node 04_create_payout.ts <email> <withdraw_currency> <withdraw_amount> <crypto_currency> <address>
# Example:
npx ts-node 04_create_payout.ts user@example.com USD 10 BTC 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

### 5. Check Payout Status

Check the status of a payout using its reference.

```sh
npx ts-node 05_check_payout_status.ts <payout_reference>
```

## Extending the Flow

- Add scripts for refunds, confirm/cancel/refresh payout, or webhook simulation using the documented endpoints in Triple-A's API.
- Create a master script to automate the full flow or batch payouts.
- Integrate these scripts into your backend or admin dashboard as needed.

## Best Practices

- **Never commit secrets** (client ID, secret, merchant key) to version control.
- Use a secrets manager or environment variables for sensitive data.
- Log all payout attempts and errors for audit and troubleshooting.
- Use the sandbox environment for testing before going live.

## References

- [Triple-A API Documentation](https://api.triple-a.io/)
- See `tripleA.json` (Postman collection) for full endpoint details.

---

**Contributions and improvements welcome!**

# Triple-A Regulated Payout/Remittance Workflow

This document describes the step-by-step workflow for using the regulated payout/remittance scripts in this directory. It also provides guidance on automation and error handling/validation.

---

## Workflow Steps

### 1. Create Sender

- **Script:** `06_create_sender.ts`
- **Input:**
  - Sender first name
  - Sender last name
  - Sender email
  - Sender country (ISO code, e.g. US)
  - Sender date of birth (YYYY-MM-DD)
- **Output:**
  - `sender_id` (copy for next steps)

### 2. Upload KYC Documents

- **Script:** `07_upload_kyc.ts`
- **Input:**
  - Sender ID (from previous step)
  - Document type (e.g. passport, id_card)
  - Path to document file
- **Output:**
  - KYC document upload confirmation

### 3. Create Recipient

- **Script:** `08_create_recipient.ts`
- **Input:**
  - Recipient first name
  - Recipient last name
  - Recipient email
  - Recipient country (ISO code, e.g. US)
  - Recipient date of birth (YYYY-MM-DD)
- **Output:**
  - `recipient_id` (copy for next steps)

### 4. Add Destination Account

- **Script:** `09_add_destination_account.ts`
- **Input:**
  - Recipient ID (from previous step)
  - Account type (bank_account, digital_wallet)
  - Account number
  - Bank code (if applicable)
  - Currency (e.g. USD)
- **Output:**
  - `destination_account_id` (copy for next steps)

### 5. Prepare Transfer

- **Script:** `10_prepare_transfer.ts`
- **Input:**
  - Sender ID (from step 1)
  - Recipient ID (from step 3)
  - Destination Account ID (from step 4)
  - Amount
  - Currency
- **Output:**
  - `transfer_id` (copy for next steps)

### 6. Confirm Transfer

- **Script:** `11_confirm_transfer.ts`
- **Input:**
  - Transfer ID (from previous step)
- **Output:**
  - Transfer confirmation

### 7. Get Transfer Status

- **Script:** `12_get_transfer_status.ts`
- **Input:**
  - Transfer ID (from previous step)
- **Output:**
  - Transfer status details

---

## Notes on IDs

- **sender_id:** Output from step 1, used in steps 2 and 5
- **recipient_id:** Output from step 3, used in steps 4 and 5
- **destination_account_id:** Output from step 4, used in step 5
- **transfer_id:** Output from step 5, used in steps 6 and 7

---

## Automation (Optional)

- Once you are comfortable with the manual process, you can create a master script to chain these steps together, passing data automatically between them.
- This is useful for testing, batch operations, or production workflows.

---

## Error Handling and Validation

- Add checks for required fields in each script.
- Validate user input:
  - **Date format:** Ensure dates are in YYYY-MM-DD format.
  - **Email format:** Ensure emails are valid.
  - **Required fields:** Prompt again if a required field is missing.
- Improve error messages to help debug issues quickly.

---

## Contribution

Feel free to extend these scripts for company entities, webhook handling, or other use cases as needed.
