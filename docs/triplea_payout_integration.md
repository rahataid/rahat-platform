# Triple-A Payout Integration with Rahat Platform

## Overview

This document explains how the Figma screens of the Rahat platform align with the Triple-A payout API flow. It details the mapping between UI actions, backend logic, and Triple-A API endpoints, and describes the responsibilities of each layer in the system.

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
  - Processes actual crypto payouts, provides status updates, and handles compliance.

---

## Figma Screen to Triple-A API Mapping

| Figma Screen        | Rahat Backend Action                       | Triple-A API Endpoint(s)                                        |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| Dashboard           | List CHWs, stats, batch payout trigger     | (none directly)                                                 |
| Worker Details      | Show wallet, phone, payout history         | GET payout status (via backend)                                 |
| Create New Payment  | Validate, initiate payout, show conversion | POST /payout/withdraw/local/crypto/direct<br>GET /exchange_rate |
| Payment Success     | Show confirmation, status, transaction ID  | GET /payout/withdraw/{ref}                                      |
| Transaction History | List all payouts, show status              | GET /payout/withdraw/{ref} (for updates)                        |
| Batch Payouts       | Loop payouts, aggregate results            | POST /payout/withdraw/local/crypto/direct (per CHW)             |

---

## Typical Payout Flow

1. **Frontend**: User initiates a payout via the UI.
2. **Rahat Backend**:
   - Authenticates with Triple-A (`/api/v2/oauth/token`).
   - Initiates payout (`POST /api/v2/payout/withdraw/local/crypto/direct`).
   - Stores payout reference and status.
   - Tracks payout status via polling or webhook notifications (`GET /api/v1/payout/withdraw/{ref}`).
   - Updates UI and notifies user as status changes.
3. **Triple-A**: Processes payout, returns status updates, and handles compliance.

---

## Backend Responsibilities

- Authenticate with Triple-A and manage tokens.
- Register beneficiaries if required.
- Initiate payouts and store transaction records.
- Listen for webhooks or poll Triple-A for status updates.
- Validate all inputs and handle errors.
- Send notifications (SMS, email) to CHWs.
- Expose RESTful endpoints for the frontend to use.

---

## What's Implied but Not Shown in Figma

- Authentication with Triple-A (handled by backend).
- Webhook handling for real-time status updates.
- Error handling and retries for failed payouts.
- Balance checks before initiating payouts.
- Notifications to CHWs (SMS/email).

---

## Conclusion

- The Figma screens align well with the Triple-A API flow, assuming Rahat acts as the backend/middle layer.
- All sensitive logic and API calls are handled by Rahat backend, keeping the frontend simple and secure.
- Any missing backend logic (webhooks, error handling, batch processing) should be implemented in Rahat, not the frontend.

---

**This document should be updated as the integration evolves or if new providers are added.**
