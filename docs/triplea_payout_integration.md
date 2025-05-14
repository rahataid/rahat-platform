# Triple-A Regulated Payout Integration with Rahat Platform

## Overview

This document details how the Rahat platform integrates with Triple-A for **regulated payouts** (bank/fiat/remittance). It maps UI actions to backend logic and Triple-A API endpoints, and clarifies the responsibilities of each layer.

---

## Architecture Summary

- **Frontend (Rahat UI):**
  - Collects user input (e.g., payout details), displays data, and triggers backend actions.
  - Does **not** interact directly with Triple-A; all sensitive operations are handled by the backend.
- **Rahat Backend (Middle Layer):**
  - Handles all Triple-A API calls, authentication, error handling, and status tracking.
  - Exposes its own REST API for the frontend to use.
  - Stores all payout and status data for reporting and audit.
- **Triple-A:**
  - Processes actual payouts, provides status updates, and handles compliance.

---

## Regulated Payout Flow: Backend Steps & Triple-A Endpoints

| Step                       | Backend Action                              | Triple-A API Endpoint(s)                         |
| -------------------------- | ------------------------------------------- | ------------------------------------------------ |
| 1. Authenticate            | Get access token                            | `POST /api/v2/oauth/token`                       |
| 2. Create Sender           | Register sender (individual/company)        | `POST /api/v2/individuals` / `/api/v2/companies` |
| 3. Upload KYC              | Upload KYC docs for sender                  | `POST /api/v2/documents`                         |
| 4. Create Recipient        | Register recipient (individual/company)     | `POST /api/v2/individuals` / `/api/v2/companies` |
| 5. Add Destination Account | Add recipient's bank account/digital wallet | `POST /api/v2/destination-accounts`              |
| 6. Prepare Transfer        | Initiate payout/transfer                    | `POST /api/v2/transfers`                         |
| 7. Confirm Transfer        | Confirm and execute transfer                | `POST /api/v2/transfers/{transfer_id}/confirm`   |
| 8. Get Transfer Status     | Check transfer status                       | `GET /api/v2/transfers/{transfer_id}`            |

---

## Example Request/Response Payloads

### Create Sender (Individual)

**Request:**

```json
POST /api/v2/individuals
{
  "first_name": "Alice",
  "last_name": "Smith",
  "email": "alice@example.com",
  "country": "US",
  "date_of_birth": "1990-01-01"
}
```

**Response:**

```json
{
  "id": "sender_12345",
  "status": "pending_kyc"
}
```

### Upload KYC

**Request:**

- `POST /api/v2/documents` (multipart/form-data)
  - `sender_id`: `sender_12345`
  - `type`: `passport`
  - `file`: (binary file)
    **Response:**

```json
{
  "id": "kyc_abcde",
  "status": "pending_review"
}
```

### Add Destination Account

**Request:**

```json
POST /api/v2/destination-accounts
{
  "recipient_id": "recipient_67890",
  "type": "bank_account",
  "account_number": "123456789",
  "bank_code": "001",
  "currency": "USD"
}
```

**Response:**

```json
{
  "id": "dest_98765",
  "status": "active"
}
```

### Prepare Transfer

**Request:**

```json
POST /api/v2/transfers
{
  "sender_id": "sender_12345",
  "recipient_id": "recipient_67890",
  "destination_account_id": "dest_98765",
  "amount": "100",
  "currency": "USD"
}
```

**Response:**

```json
{
  "id": "transfer_abc123",
  "status": "pending_confirmation"
}
```

### Confirm Transfer

**Request:**

```json
POST /api/v2/transfers/transfer_abc123/confirm
{}
```

**Response:**

```json
{
  "id": "transfer_abc123",
  "status": "processing"
}
```

### Get Transfer Status

**Request:**

```json
GET /api/v2/transfers/transfer_abc123
```

**Response:**

```json
{
  "id": "transfer_abc123",
  "status": "completed",
  "amount": "100",
  "currency": "USD",
  "timestamp": "2024-05-14T12:00:00Z"
}
```

---

## Error Handling & Common Errors

- **Invalid KYC:**
  - Response: `{ "error": "KYC document rejected", "reason": "Document expired" }`
  - Action: Notify user, allow re-upload.
- **Insufficient Balance:**
  - Response: `{ "error": "Insufficient balance" }`
  - Action: Alert admin, block payout.
- **Invalid Account:**
  - Response: `{ "error": "Invalid account number" }`
  - Action: Prompt user to correct details.
- **General:**
  - Always log full error responses and surface user-friendly messages to the frontend.

---

## Webhook Handling

- **If Triple-A supports webhooks for payout status:**
  - Expose a backend endpoint (e.g., `/webhook/triplea`) to receive notifications.
  - Example payload:
    ```json
    {
      "event": "transfer.status.updated",
      "transfer_id": "transfer_abc123",
      "status": "completed"
    }
    ```
  - Verify authenticity (e.g., using a secret or signature).
  - Update transaction status in your database and notify the user.

---

## Security & Compliance Notes

- Never expose Triple-A API keys or tokens to the frontend.
- Store all payout and KYC data securely and audit all changes.
- Comply with local regulations for KYC, AML, and data retention.

---

## Batch Processing Guidance

- For batch payouts, loop through recipients and repeat steps 2-7 for each.
- Log all results and handle partial failures gracefully (e.g., retry or alert admin).

---

## Testing & Sandbox Usage

- Use Triple-A's sandbox environment for development/testing.
- Use test credentials and testnet accounts as provided by Triple-A.
- Validate all flows in sandbox before going live.

---

## Glossary

- **Sender:** The party initiating the payout.
- **Recipient:** The party receiving the payout.
- **KYC:** Know Your Customer (identity verification process).
- **Transfer:** The payout transaction.
- **Destination Account:** The recipient's bank account or wallet.

---

## Change Log

- 2024-05-14: Added example payloads, error handling, webhook, and security sections.
- 2024-05-13: Initial version with endpoint mapping and flow.

---

## References

- [Triple-A API Documentation](https://api.triple-a.io/)
- [Your Postman Collection](../tripleA.json)
- [Rahat Platform Backend Docs] (add link if available)

---

## Backend Responsibilities

- Authenticate with Triple-A and manage tokens.
- Register senders/recipients (individual or company) and upload KYC documents.
- Add destination accounts (bank or wallet).
- Initiate, confirm, and track payouts.
- Store all transaction and status data for audit.
- Listen for webhooks or poll Triple-A for status updates.
- Validate all inputs and handle errors robustly.
- Send notifications (SMS, email) to users as needed.
- Expose RESTful endpoints for the frontend to use.

---

## Figma Screen to Triple-A API Mapping (Regulated Flow)

| Figma Screen        | Rahat Backend Action                       | Triple-A API Endpoint(s)                   |
| ------------------- | ------------------------------------------ | ------------------------------------------ |
| Dashboard           | List CHWs, stats, batch payout trigger     | (none directly)                            |
| Worker Details      | Show wallet, phone, payout history         | `GET /api/v2/transfers/{id}` (via backend) |
| Create New Payment  | Validate, initiate payout, show conversion | Steps 1-7 above                            |
| Payment Success     | Show confirmation, status, transaction ID  | `GET /api/v2/transfers/{id}`               |
| Transaction History | List all payouts, show status              | `GET /api/v2/transfers/{id}`               |
| Batch Payouts       | Loop payouts, aggregate results            | Steps 1-7 above (per recipient)            |

---

## Notes

- All Triple-A API calls are made by the backend, never the frontend.
- Webhook handling, error retries, and audit logging are backend responsibilities.
- The backend should validate all data before calling Triple-A.
- Crypto payout endpoints (e.g., `/api/v2/payout/withdraw/local/crypto/direct`) are **not used** in the regulated payout flow.

---

## Example: Regulated Payout API Call Sequence

1. **Authenticate:**
   - `POST /api/v2/oauth/token`
2. **Create Sender:**
   - `POST /api/v2/individuals` or `/api/v2/companies`
3. **Upload KYC:**
   - `POST /api/v2/documents`
4. **Create Recipient:**
   - `POST /api/v2/individuals` or `/api/v2/companies`
5. **Add Destination Account:**
   - `POST /api/v2/destination-accounts`
6. **Prepare Transfer:**
   - `POST /api/v2/transfers`
7. **Confirm Transfer:**
   - `POST /api/v2/transfers/{transfer_id}/confirm`
8. **Get Transfer Status:**
   - `GET /api/v2/transfers/{transfer_id}`

---

## Conclusion

- The Rahat backend orchestrates the full regulated payout flow using the above Triple-A endpoints.
- All sensitive logic, error handling, and audit logging are handled by the backend.
- The frontend remains simple, secure, and focused on user experience.

---

**Update this document as the integration evolves or if new endpoints are added.**
