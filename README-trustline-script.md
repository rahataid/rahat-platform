# Bulk Trustline Check Script with Database Integration

This script checks trustlines for all beneficiaries in a project by:

1. Connecting to both core and project databases
2. Getting all beneficiaries from the project database
3. Checking if beneficiaries have wallet addresses
4. Checking if wallet secrets exist in filesystem storage
5. Creating stellar wallets for beneficiaries without wallets
6. Checking trustlines on the Stellar network
7. Adding trustlines for beneficiaries that don't have them
8. Updating both databases with new wallet addresses

## Features

- ✅ Connects to both core and project databases
- ✅ Gets beneficiaries directly from project database
- ✅ Uses wallet storage from filesystem
- ✅ Creates stellar wallets for beneficiaries without wallets
- ✅ Checks trustlines on Stellar network
- ✅ Adds trustlines for beneficiaries without trustlines
- ✅ Updates both databases with new wallet addresses
- ✅ Supports both dry-run and live modes
- ✅ Comprehensive logging and error handling
- ✅ Environment variable configuration

## Prerequisites

1. **Database Access**: Access to both core and project databases
2. **Wallet Storage**: Wallet files should be in the configured storage directory
3. **Stellar Network**: Access to Stellar horizon server
4. **Asset Configuration**: Asset code and issuer address for trustline checks

## Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://admin:admin@localhost:5432/rahat
PROJECT_DATABASE_URL=postgresql://rahat:rahat123@localhost:5555/rahat-aa

# Stellar Configuration
HORIZON_SERVER=https://horizon-testnet.stellar.org
ASSET_CODE=RAHAT
ASSET_ISSUER=GCVLRQHGZYG32HZE3PKZ52NX5YFCNFDBUZDLUXQYMRS6WVBWSUOP5IYE
NETWORK=testnet
FAUCET_BASE_URL=https://faucet.stellar.org
FAUCET_AUTH_KEY=your-faucet-auth-key-here

# Wallet Storage
WALLET_PATH=./wallet_storage
```

### Constants to Update

In `check-trustline-with-api.ts`, update these constants if needed:

```typescript
const ASSET_ISSUER = process.env.ASSET_ISSUER || 'GCVLRQHGZYG32HZE3PKZ52NX5YFCNFDBUYDLUXQYMRS6WVBWSUOP5IYE';
```

## Usage

### Basic Usage

```bash
# Dry run (check only, no changes)
node check-trustline-with-api.ts

# Live run (apply changes)
FAUCET_AUTH_KEY=your-auth-key node check-trustline-with-api.ts --live

# With custom database URLs and faucet
DATABASE_URL=postgresql://user:pass@host:5432/db \
PROJECT_DATABASE_URL=postgresql://user:pass@host:5555/db \
FAUCET_AUTH_KEY=your-auth-key \
node check-trustline-with-api.ts --live
```

### Command Line Options

- `--live`: Apply actual changes (default: dry run)
- `--help` or `-h`: Show help message

## Database Integration

The script connects to two databases:

### Core Database

- **URL**: `DATABASE_URL` environment variable
- **Default**: `postgresql://admin:admin@localhost:5432/rahat`
- **Purpose**: Updates beneficiary wallet addresses

### Project Database

- **URL**: `PROJECT_DATABASE_URL` environment variable
- **Default**: `postgresql://rahat:rahat123@localhost:5555/rahat-aa`
- **Purpose**: Source of beneficiary data

### Beneficiary Query

```typescript
const beneficiaries = await projectPrisma.beneficiary.findMany({
  where: {
    deletedAt: null,
  },
});
```

## Wallet Storage Integration

The script uses the `FileWalletStorage` class to retrieve wallet secrets from the filesystem. It looks for wallet files in the format:

```
{BLOCKCHAIN}_{ADDRESS}.json
```

Example:

- `STELLAR_GABC123...DEF.json`
- `EVM_0x123...ABC.json`

The script looks for stellar wallet files for each wallet address.

## Implementation Notes

### Stellar Integration

The script uses real Stellar SDK for:

1. **Account Existence Check**: Verifies if wallet exists on Stellar network
2. **Trustline Check**: Checks if wallet has trustline for the specified asset
3. **Trustline Addition**: Adds trustline to wallet if missing

### Database Updates

The script updates both databases:

```typescript
// Update in project database
await projectPrisma.beneficiary.update({
  where: { uuid: beneficiaryUuid },
  data: { walletAddress },
});

// Update in core database
await corePrisma.beneficiary.update({
  where: { uuid: beneficiaryUuid },
  data: { walletAddress },
});
```

## Output

The script provides detailed logging including:

- 🔍 Fetching beneficiaries from database
- ✅ Found wallet keys
- ❌ Missing wallet keys
- 🔧 Creating new wallets
- 🔗 Adding trustlines
- 📊 Summary statistics

### Sample Output

```
🚀 Starting bulk trustline check in dry mode...

🔧 Connected to databases:
   Core DB: postgresql://admin:admin@localhost:5432/rahat
   Project DB: postgresql://rahat:rahat123@localhost:5555/rahat-aa
   Horizon Server: https://horizon-testnet.stellar.org
   Asset: USDC (your-asset-issuer-here)

🔍 Fetching beneficiaries from project database...
✅ Found 150 beneficiaries from database

📊 Found 150 beneficiaries to check

🔍 Checking beneficiary: uuid-123
❌ No wallet address for beneficiary: uuid-123

🔍 Checking beneficiary: uuid-456
✅ Wallet found: GABC123...DEF, checking trustline...
❌ Trustline not found for wallet: GABC123...DEF

📊 SUMMARY
============================================================
Total beneficiaries: 150
Without wallet address: 25
Without wallet in storage: 5
Without trustline: 120
Already have trustline: 0
Database updates: 120

⚠️  Beneficiaries without wallet address:
   - uuid-123
   - uuid-124

⚠️  Beneficiaries without wallet in storage:
   - uuid-456: GABC123...DEF
   - uuid-457: GABC123...GHI

⚠️  Beneficiaries without trustline:
   - GABC123...DEF
   - GABC123...GHI

🔍 Dry run completed. Run with --live to apply changes.
```

## Error Handling

The script includes comprehensive error handling for:

- Database connection issues
- Missing wallet files
- Stellar network errors
- Wallet creation failures
- Trustline addition failures

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check `DATABASE_URL` and `PROJECT_DATABASE_URL`
   - Verify database servers are running
   - Check network connectivity

2. **No Beneficiaries Found**

   - Verify project database has beneficiaries
   - Check database schema matches expectations
   - Ensure beneficiaries are not soft-deleted

3. **Wallet Files Not Found**

   - Check `WALLET_PATH` configuration
   - Verify wallet files exist in storage directory
   - Check file naming convention (STELLAR_ADDRESS.json)

4. **Stellar Network Issues**
   - Check `HORIZON_SERVER` configuration
   - Verify asset code and issuer are correct
   - Ensure network connectivity to Stellar

## Future Enhancements

1. **Batch Processing**: Process beneficiaries in batches for better performance
2. **Retry Logic**: Add retry mechanisms for failed operations
3. **Progress Tracking**: Add progress bars for large beneficiary lists
4. **Configuration File**: Support configuration from JSON/YAML files
5. **Trustline Tracking**: Add trustline status tracking to database schema
6. **Multi-Asset Support**: Support checking/adding multiple asset trustlines

## Contributing

When implementing new functionality:

1. Add proper error handling for network operations
2. Implement database schema changes for trustline tracking
3. Add unit tests for new functionality
4. Update documentation with usage examples
5. Follow the existing code patterns and error handling

Environment Variables:
DATABASE_URL Core database URL (default: postgresql://admin:admin@localhost:5432/rahat)
PROJECT_DATABASE_URL Project database URL (default: postgresql://rahat:rahat123@localhost:5555/rahat-aa)
HORIZON_SERVER Stellar horizon server (default: https://horizon-testnet.stellar.org)
ASSET_CODE Asset code (default: RAHAT)
ASSET_ISSUER Asset issuer address
NETWORK Stellar network (default: testnet)
FAUCET_BASE_URL Faucet service URL (default: https://faucet.stellar.org)
FAUCET_AUTH_KEY Authentication key for faucet service (required for live mode)
WALLET_PATH Path to wallet storage directory

Process:

1. Connect to both core and project databases
2. Get all beneficiaries from project database
3. Check if beneficiary has wallet address
4. Check if wallet exists in filesystem storage
5. Create stellar wallet if missing (live mode only)
6. Check if account exists on Stellar network
7. Fund account using external faucet if it doesn't exist (live mode only)
8. Check trustline on Stellar network
9. Add trustline if missing (live mode only)
10. Update databases with new wallet addresses (live mode only)
