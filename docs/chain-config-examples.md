# Chain Configuration

This document provides examples of the chain-agnostic configuration format.

## Configuration Format

The configuration uses a flat structure with explicit chain type specification:

### EVM Chain Example (Localhost)

```json
{
  "chainId": "8888",
  "name": "localhost",
  "type": "evm",
  "rpcUrl": "http://127.0.0.1:8888",
  "explorerUrl": "https://etherscan.io",
  "currency": {
    "name": "LOCALHOST_ETH",
    "symbol": "ETH"
  }
}
```

### EVM Chain Example (Base Sepolia)

```json
{
  "chainId": "84532",
  "name": "base-sepolia",
  "type": "evm",
  "rpcUrl": "https://base-sepolia-rpc.publicnode.com",
  "explorerUrl": "https://sepolia.basescan.org",
  "currency": {
    "name": "BASE_ETH",
    "symbol": "ETH"
  }
}
```

### Stellar Chain Example

```json
{
  "chainId": "Public Global Stellar Network ; September 2015",
  "name": "stellar-mainnet",
  "type": "stellar",
  "rpcUrl": "https://stellar-soroban-public.nodies.app",
  "explorerUrl": "https://stellar.expert",
  "currency": {
    "name": "STELLAR_XLM",
    "symbol": "XLM"
  }
}
```

## Required Fields

All chain configurations must include:

- `chainId`: Chain identifier (string)
- `name`: Human-readable chain name
- `type`: Chain type ("evm" or "stellar")
- `rpcUrl`: RPC endpoint URL
- `explorerUrl`: Block explorer URL
- `currency.name`: Currency name (format: NETWORK_TOKEN)
- `currency.symbol`: Currency symbol

## Key Features

1. **Explicit Chain Type**: The `type` field clearly identifies whether it's "evm" or "stellar"
2. **Flat Structure**: No nested objects - all properties are at the root level
3. **Chain Agnostic**: Same structure works for both EVM and Stellar chains
4. **Simplified URLs**: Direct `rpcUrl` and `explorerUrl` properties
5. **Consistent Currency Naming**: Currency name follows NETWORK_TOKEN format (e.g., BASE_ETH, STELLAR_XLM)

## Environment Variables

For environment-based configuration, use these variables:

```bash
CHAIN_ID=8888
CHAIN_NAME=localhost
CHAIN_TYPE=evm
NETWORK_PROVIDER=http://127.0.0.1:8888
BLOCK_EXPLORER_URL=https://etherscan.io
CURRENCY_NAME=LOCALHOST_ETH
CURRENCY_SYMBOL=ETH
```
