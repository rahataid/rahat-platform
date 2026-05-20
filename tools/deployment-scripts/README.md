# Rahat Platform Deployment Scripts

This directory contains a structured workflow for deploying and configuring the Rahat platform on various blockchain networks. The deployment process follows a numbered step-by-step approach, building a comprehensive deployment configuration file that is later synced to the database.

## Overview

The deployment workflow is designed to:
- Break down complex setup into manageable, interactive steps
- Persist configurations in a JSON-based deployment file
- Validate inputs at each step
- Provide a final database sync mechanism

## Deployment Workflow

Run the scripts in the following order. Each script can be invoked via npm commands:

**Required Steps:** 0-3, 5-8 (8 total steps)  
**Optional Steps:** 4 (Access Manager - can be run independently as needed)

### Step 0: Initialize Project
```bash
pnpm deploy:setup-project
```
- **File:** `0.setup-project.js`
- **Purpose:** Create a new deployment configuration file
- **Prompts for:** 
  - Project ID (e.g., `core-production`, `core-staging`)
- **Output:** Creates `deployments/{projectId}.json` with initial structure

### Step 1: Configure Blockchain Network
```bash
pnpm deploy:chainsettings
```
- **File:** `1.setup-chain-settings.js`
- **Purpose:** Configure blockchain network details
- **Prompts for:**
  - Chain type (EVM or Stellar)
  - Network tier (mainnet, testnet, devnet)
  - Preset configuration (Ethereum, Polygon, Base, Stellar, etc.)
  - Custom RPC URL (if selecting custom preset)
- **Output:** Adds `CHAIN_SETTINGS` to deployment file with:
  - Network name, type, and RPC URL
  - Chain ID and currency details
  - Block explorer URL

### Step 2: Configure Subgraph
```bash
pnpm deploy:subgraphsettings
```
- **File:** `2.setup-subgraph-settings.js`
- **Purpose:** Set up the GraphQL subgraph endpoint
- **Prompts for:**
  - Subgraph URL (e.g., `http://localhost:8000/subgraphs/name/rahat/core`)
- **Output:** Adds `SUBGRAPH_URL` setting to deployment file

### Step 3: Deploy Core Contracts
```bash
pnpm deploy:contractsettings
```
- **File:** `3.setup-contract-settings.js`
- **Purpose:** Deploy platform core contracts to the blockchain
- **Deploys:**
  - RahatAccessManager (access control)
  - ERC2771Forwarder (meta-transaction forwarder)
  - RahatTreasury (token management)
  - RahatToken (ERC-20 token)
- **Prompts for:**
  - Deployer private key (requires gas funds)
  - Token name, symbol, description
  - Token decimals
  - Initial token supply
  - Forwarder name
- **Output:** Adds both `CONTRACT` and `CONTRACTS` settings with:
  - Deployed contract addresses
  - Contract ABIs (Application Binary Interfaces)

### Step 4: Initialize Access Manager (Optional)
```bash
pnpm deploy:accessmanager
```
- **File:** `4.setup-access-manager.js`
- **Purpose:** Grant admin role to designated addresses (run as needed after deployment)
- **When to run:** After initial deployment, when you need to add additional admin accounts
- **Prompts for:**
  - Admin address to be granted ADMIN_ROLE
  - Deployer private key
  - Execution delay (in seconds, default 0)
- **Output:** Executes `grantRole()` on RahatAccessManager contract

**Note:** This is an optional step and does not need to be run during the initial setup process.

### Step 5: Configure Communication Settings
```bash
pnpm deploy:communicationsettings
```
- **File:** `5.setup-communication-settings.js`
- **Purpose:** Set up communication service configuration
- **Prompts for:**
  - Communication service URL
  - Application ID
  - SMS transport ID
  - Static OTP (for testing)
  - Enable static OTP flag
- **Output:** Adds `COMMUNICATION` setting to deployment file

### Step 6: Configure Offramp Settings
```bash
pnpm deploy:offrampsettings
```
- **File:** `6.setup-offramp-settings.js`
- **Purpose:** Configure offramp (fiat conversion) service
- **Prompts for:**
  - Offramp service URL
  - Application ID
  - Access token
- **Output:** Adds `OFFRAMP_SETTINGS` to deployment file

### Step 7: Configure SMS Settings
```bash
pnpm deploy:smssettings
```
- **File:** `7.setup-sms-settings.js`
- **Purpose:** Set up SMS notification configuration
- **Prompts for:**
  - SMS service URL
  - Application ID
  - Authentication token
  - SMS message template
  - SMS provider name
- **Output:** Adds `SMS_SETTINGS` (array) to deployment file

### Step 8: Sync to Database
```bash
pnpm deploy:sync-settings
```
- **File:** `8.update-settings-via-prisma.js`
- **Purpose:** Upload all settings from deployment file to the database
- **Prerequisites:**
  - `CORE_DATABASE_URL` environment variable must be set
  - All required settings should be present in the deployment file
- **Output:** Upserts all settings in the `tbl_settings` table

## Deployment File Structure

Each deployment file is stored in `deployments/{projectId}.json` and follows this structure:

```json
{
  "projectId": "core-production",
  "createdAt": "2026-05-11T07:59:38.301Z",
  "settings": [
    {
      "name": "SETTING_NAME",
      "value": "setting value (string, object, or array)",
      "dataType": "STRING|OBJECT|NUMBER|BOOLEAN",
      "requiredFields": "[]",
      "isReadOnly": false,
      "isPrivate": false
    }
  ]
}
```

### Setting Properties
- **name:** Unique identifier for the setting (e.g., `CHAIN_SETTINGS`, `COMMUNICATION`)
- **value:** Configuration value (stored as JSON string)
- **dataType:** Data type for validation and parsing
- **requiredFields:** Array of required field names within complex objects
- **isReadOnly:** Whether the setting can be modified after creation
- **isPrivate:** Whether the setting is sensitive (e.g., API keys)

## Environment Variables

For the final database sync step, ensure these are set:

```bash
# Required for database sync
CORE_DATABASE_URL=postgresql://user:password@localhost:5432/rahat_core

# Optional: Used as defaults in prompts
COMMUNICATION_URL=
COMMUNICATION_APP_ID=
SMS_TRANSPORT_ID=
STATIC_OTP=
USE_STATIC_OTP=

PAYMENT_PROVIDER_URL=
PAYMENT_PROVIDER_APP_ID=
PAYMENT_PROVIDER_ACCESS_TOKEN=

SMS_SETTINGS_URL=
SMS_SETTINGS_APP_ID=
SMS_SETTINGS_TOKEN=
SMS_SETTINGS_MESSAGE=
SMS_SETTINGS_PROVIDER=
```

## Common Workflows
required steps in sequence
pnpm deploy:setup-project
pnpm deploy:chainsettings
pnpm deploy:subgraphsettings
pnpm deploy:contractsettings
pnpm deploy:communicationsettings
pnpm deploy:offrampsettings
pnpm deploy:smssettings
pnpm deploy:sync-settings
```

### Grant Admin Role (Optional, after initial deployment)
```bash
# Run this when you need to add additional admin accounts
pnpm deploy:accessmanagersettings
pnpm deploy:offrampsettings
pnpm deploy:smssettings
pnpm deploy:sync-settings
```

### Modify Existing Deployment
```bash
# Run any specific step(s) and then sync
pnpm deploy:communicationsettings    # Update communication settings
pnpm deploy:offrampsettings         # Update offramp settings
pnpm deploy:sync-settings           # Sync all changes to database
```

### Backup and Recovery
```bash
# All deployment files are stored in deployments/ folder
# Backup before critical deployments
cp -r deployments deployments-backup-$(date +%Y%m%d)

# Restore from backup
cp deployments-backup-20260511/* deployments/
```

## Troubleshooting

### "CHAIN_SETTINGS not found"
- **Cause:** Step 2 (chain settings) hasn't been run yet
- **Solution:** Run `pnpm deploy:chainsettings` first

### "CONTRACT settings not found"
- **Cause:** Step 3 (contract deployment) hasn't been run yet
- **Solution:** Run `pnpm deploy:contractsettings` first

### "Failed to deploy contract"
- **Cause:** Deployer wallet doesn't have enough gas funds
- **Solution:** 
  - Check wallet balance on the target network
  - Fund the deployer address with native currency
  - Retry contract deployment

### "Database sync failed"
- **Cause:** `CORE_DATABASE_URL` not set or database unreachable
- **Solution:**
  - Set `CORE_DATABASE_URL` environment variable
  - Verify database connection
  - Check database permissions and credentials

### "RPC connection failed"
- **Cause:** Invalid or unreachable RPC URL
- **Solution:**
  - Verify the RPC URL is correct
  - Check network connectivity
  - Try a different RPC provider

## File References

- **_common.js** - Shared utility functions for file I/O and prompting
- **deployments/** - Directory containing deployment configuration files
- **contracts/** - Symbolic link to compiled contract ABIs (used for deployment)

## Development Notes

- Each script is idempotent - running the same script twice updates the existing setting
- All prompts have sensible defaults that can be overridden by environment variables
- Private keys are never logged or stored; they're only used for transaction signing
- Deployment files should be version controlled but deployment secrets should be in environment variables

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the specific script's inline documentation
3. Verify all prerequisites are met before running a step
4. Check environment variables are properly set
