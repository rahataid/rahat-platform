# Wallet Service Documentation

## Overview

The Wallet Service is a core component of the Rahat platform that provides comprehensive wallet management capabilities for blockchain-based humanitarian aid operations. It supports both **EVM-based chains** (Ethereum, Base, Polygon, etc.) and **Stellar chain**, enabling secure wallet creation, management, and transaction handling.

## Features

### Multi-Chain Support
- **EVM Chains**: Support for Ethereum-compatible blockchains (Ethereum, Base, Polygon, etc.)
- **Stellar Chain**: Support for Stellar blockchain with Soroban smart contracts
- **Dynamic Chain Detection**: Automatic detection of chain type from wallet addresses
- **Chain-Specific Configuration**: Separate RPC endpoints and network settings for each chain type

### Wallet Management
- **Wallet Creation**: Generate new wallets for any supported chain
- **Bulk Wallet Creation**: Create multiple wallets in a single operation
- **Wallet Import**: Import existing wallets using private keys
- **Wallet Connection**: Connect to existing wallets for transaction signing
- **Address Validation**: Validate wallet addresses for supported chains

### Security & Storage
- **Secure Storage**: File-based storage with encryption support
- **Private Key Management**: Secure handling of private keys and wallet secrets
- **Phone Number Association**: Link wallet addresses to beneficiary phone numbers
- **Bulk Operations**: Secure bulk wallet operations for beneficiary management

## Architecture

### Core Components

#### 1. Wallet Service (`WalletService`)
The main service class that orchestrates wallet operations:

```typescript
@Injectable()
export class WalletService implements OnModuleInit {
  // Core wallet operations
  async createWallet(chainType?: ChainType): Promise<WalletKeys>
  async create(chains: ChainType[]): Promise<WalletCreateResult[]>
  async createBulk(count: number): Promise<WalletCreateResult[]>
  async importWallet(privateKey: string, chain?: ChainType): Promise<WalletKeys>
  async connectWallet(address: string, chain?: ChainType): Promise<IConnectedWallet>
}
```

#### 2. Blockchain Provider Registry (`BlockchainProviderRegistry`)
Manages wallet implementations for different blockchain types:

```typescript
export class BlockchainProviderRegistry {
  // Register and manage wallet managers
  async initializeChain(chainType: ChainType, config?: any): Promise<void>
  async createWallet(chainType: ChainType): Promise<WalletKeys>
  async connectWallet(address: string, chainType: ChainType): Promise<IConnectedWallet>
  validateAddress(address: string, chainType: ChainType): boolean
}
```

#### 3. Wallet Implementations
- **EVMWallet**: Handles Ethereum-compatible chains
- **StellarWallet**: Handles Stellar blockchain operations

#### 4. Storage Layer
- **FileWalletStorage**: File-based wallet storage with encryption support
- **MemoryWalletStorage**: In-memory storage for testing

### Module Structure

```
apps/rahat/src/wallet/
├── wallet.service.ts          # Main service logic
├── wallet.controller.ts       # API endpoints
├── wallet.module.ts          # Module configuration
├── providers/
│   └── blockchain-provider.registry.ts  # Chain management
├── storages/
│   └── fs.storage.ts         # File storage implementation
├── types/
│   └── chain-config.interface.ts       # Configuration types
└── dto/
    └── getBy.dto.ts          # Data transfer objects
```

## Configuration

### Chain Settings
The wallet service uses a centralized configuration system through the Settings service:

```typescript
interface ChainConfig {
  chainId: string;
  name: string;
  type: 'evm' | 'stellar';
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
  };
}
```

### Environment Variables
- `WALLET_PATH`: Custom storage directory for wallet files
- Default storage: `./wallet_storage/`

### Default RPC Endpoints
- **EVM**: `https://base-sepolia-rpc.publicnode.com`
- **Stellar**: `https://stellar-soroban-public.nodies.app`

## API Endpoints

### Microservice Patterns
The wallet service uses NestJS microservice patterns for internal communication:

#### 1. Create Wallets
```typescript
// Create single wallet
@MessagePattern({ cmd: WalletJobs.CREATE })
create(chains: ChainType[])

// Create bulk wallets
@MessagePattern({ cmd: WalletJobs.CREATE_BULK })
createBulk(chains: BulkCreateWallet)

// Update beneficiaries with new wallets
@MessagePattern({ cmd: WalletJobs.UPDATE_BULK })
updateBulk(chains: BulkUpdateWallet)
```

#### 2. Wallet Retrieval
```typescript
// Get wallet by phone number
@MessagePattern({ cmd: WalletJobs.GET_WALLET_BY_PHONE })
getWalletByPhone(phoneDto: PhoneNumberDto)

// Get wallet secret by phone
@MessagePattern({ cmd: WalletJobs.GET_SECRET_BY_PHONE })
getSecretByPhone(account: PhoneAddressDto)

// Get wallet secret by address
@MessagePattern({ cmd: WalletJobs.GET_SECRET_BY_WALLET })
getSecretByWallet(account: WalletAddressDto)

// Get bulk wallet secrets
@MessagePattern({ cmd: WalletJobs.GET_BULK_SECRET_BY_WALLET })
getBulkSecretByWallet(accounts: BulkWalletAddressDto)
```

## Usage Examples

### 1. Creating a Single Wallet

```typescript
// Create EVM wallet
const evmWallet = await walletService.createWallet('evm');
console.log('EVM Wallet:', evmWallet.address);

// Create Stellar wallet
const stellarWallet = await walletService.createWallet('stellar');
console.log('Stellar Wallet:', stellarWallet.address);
```

### 2. Creating Multiple Wallets

```typescript
// Create wallets for multiple chains
const wallets = await walletService.create(['evm', 'stellar']);
wallets.forEach(wallet => {
  console.log(`${wallet.chain} Wallet:`, wallet.address);
});
```

### 3. Bulk Wallet Creation

```typescript
// Create 10 wallets for the current chain
const bulkWallets = await walletService.createBulk(10);
console.log(`Created ${bulkWallets.length} wallets`);
```

### 4. Importing Existing Wallet

```typescript
// Import wallet from private key
const importedWallet = await walletService.importWallet(privateKey, 'evm');
console.log('Imported Wallet:', importedWallet.address);
```

### 5. Connecting to Existing Wallet

```typescript
// Connect to existing wallet
const connectedWallet = await walletService.connectWallet(walletAddress, 'evm');

// Sign a message
const signature = await connectedWallet.signMessage('Hello World');

// Send transaction
const tx = await connectedWallet.sendTransaction(transactionData);
```

### 6. Phone Number Association

```typescript
// Get wallet by phone number
const walletAddress = await walletService.getWalletByPhone('+1234567890');

// Get wallet secret by phone
const walletKeys = await walletService.getSecretByPhone('+1234567890', 'evm');
```

### 7. Address Validation

```typescript
// Validate EVM address
const isValidEVM = await walletService.validateAddress('0x1234...', 'evm');

// Validate Stellar address
const isValidStellar = await walletService.validateAddress('GABC...', 'stellar');
```

## Data Types

### Wallet Keys
```typescript
interface WalletKeys {
  address: string;
  privateKey: string;
  publicKey?: string;
  blockchain: string;
  mnemonic?: string;
}
```

### Connected Wallet
```typescript
interface IConnectedWallet {
  signMessage(message: string): Promise<string>;
  sendTransaction(rawTransaction: any): Promise<any>;
  getWalletKeys(): WalletKeys;
}
```

### Bulk Operations
```typescript
type BulkCreateWallet = {
  chain?: ChainType;
  count: number;
};

type BulkUpdateWallet = {
  chain: ChainType;
  benUuids: string[];
};
```

## Security Considerations

### Private Key Storage
- Private keys are stored in encrypted files
- File-based storage with configurable directory
- Support for custom storage implementations

### Chain Isolation
- Each chain type has separate storage
- Chain-specific validation and configuration
- Isolated wallet management per chain

### Access Control
- Microservice-based access patterns
- Internal service communication only
- No direct external API exposure

## Error Handling

The wallet service includes comprehensive error handling:

```typescript
// Chain not supported
if (!this.providerRegistry.getSupportedChains().includes(chainType)) {
  throw new Error(`Chain ${chainType} not supported in this instance`);
}

// Configuration missing
if (!settings || !settings.value) {
  throw new Error('CHAIN_SETTINGS configuration not found');
}

// Invalid chain type
if (!validChainTypes.includes(rawValue.type as ChainType)) {
  throw new Error(`Invalid chain type "${rawValue.type}"`);
}
```

## Future Enhancements

### Multi-Chain Support
The service is designed for future multi-chain support:

```typescript
// TODO: Multi-chain support - Future enhancement to support multiple chains per instance
// Currently: One instance = One chain type
// Future: One instance = Multiple chain types with dynamic selection
```

### Planned Features
- **Dynamic Chain Selection**: Support multiple chains simultaneously
- **Enhanced Storage**: Database-backed storage options
- **Advanced Encryption**: Hardware security module integration
- **Transaction Batching**: Optimized bulk transaction processing

## Integration

### With Beneficiary Service
The wallet service integrates with the beneficiary management system:

```typescript
// Update beneficiaries with new wallets
async updateBulk(bulkUpdateWalletDto: BulkUpdateWallet) {
  return Promise.all(bulkUpdateWalletDto.benUuids.map(async (uuid) => {
    const walletAddress = await this.create([bulkUpdateWalletDto.chain]);
    const beneficiary = await this.prisma.beneficiary.update({
      where: { uuid },
      data: { walletAddress: walletAddress[0].address },
    });
    return { uuid, walletAddress: beneficiary.walletAddress, secret: walletAddress[0].privateKey };
  }));
}
```

### With Settings Service
Chain configuration is managed through the settings service:

```typescript
private async getCurrentChainSettings(): Promise<{
  detectedChain: ChainType;
  stellar: any;
  evm: any;
}> {
  const settings = await this.settings.getByName('CHAIN_SETTINGS');
  // ... configuration processing
}
```

## Testing

The wallet service includes comprehensive test coverage:

- **Unit Tests**: `wallet.service.spec.ts`
- **Controller Tests**: `wallet.controller.spec.ts`
- **Integration Tests**: End-to-end wallet operations

## Monitoring

The service includes logging for monitoring and debugging:

```typescript
private readonly logger = new Logger(WalletService.name);

this.logger.log(`Creating ${chain} wallet`);
this.logger.warn(`Chain ${chainType} not supported in this instance`);
this.logger.error('Error reading wallet file:', error);
```

## Conclusion

The Wallet Service provides a robust, secure, and scalable foundation for blockchain wallet management in the Rahat platform. Its support for both EVM and Stellar chains, combined with comprehensive security features and flexible configuration options, makes it suitable for humanitarian aid operations requiring reliable wallet infrastructure.
