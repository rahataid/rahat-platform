# User Management Documentation

## Overview

The User Management system in the Rahat platform provides comprehensive user authentication, authorization, and wallet management capabilities. It leverages the `@rumsan/user` package for core user functionality while integrating with the platform's `WalletService` for custodial wallet management.

## Architecture

### Core Components

#### 1. Users Module (`UsersModule`)
The main module that orchestrates user management operations:

```typescript
@Module({
  imports: [
    PrismaModule,
    RSUserModule.register([{ provide: RSUserService, useClass: UsersService }]),
  ],
  controllers: [CustomUsersController],
  providers: [PrismaService, EventEmitter2, UsersService],
  exports: [PrismaService, EventEmitter2, UsersService],
})
export class UsersModule {}
```

#### 2. Users Service (`UsersService`)
Extends the `@rumsan/user` package's `UsersService` to add wallet functionality:

```typescript
@Injectable()
export class UsersService extends RSUserService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly walletService: WalletService
  ) {
    super(prisma, eventEmitter);
  }
}
```

#### 3. Users Controller (`CustomUsersController`)
Provides REST API endpoints for user management:

```typescript
@Controller('users')
@ApiTags('Users')
@ApiBearerAuth(APP.JWT_BEARER)
@UseGuards(JwtGuard, AbilitiesGuard)
export class CustomUsersController {
  constructor(private usersService: UsersService) {}
}
```

## Features

### 1. User Creation with Custodial Wallets
When creating a new user, the system automatically generates a custodial wallet:

```typescript
async create(userData: CreateUserDto) {
  console.log('Creating a new user with a random wallet address');

  try {
    // Use wallet service's configured chain (single-chain per instance)
    const randomWallet = await this.walletService.createWallet();

    console.log('Random wallet created:', {
      address: randomWallet.address,
      blockchain: randomWallet.blockchain || 'detected',
    });

    userData.wallet = randomWallet.address;

    return super.create(userData);
  } catch (error) {
    console.error('Error creating user wallet:', error);
    throw error;
  }
}
```

### 2. Wallet Management
Users can retrieve their wallet information:

```typescript
async getWallets(dto: ListUserDto) {
  console.log('Listing users');
  const userListData = await super.list(dto);
  const wallets = userListData.data.map((user) => {
    return {
      name: user.name,
      wallet: user.wallet,
      // TODO: Multi-chain support - Add chain type detection
      // chainType: this.detectChainFromWallet(user.wallet)
    };
  });
  return wallets;
}
```

### 3. Multi-Chain Support (Future)
The system is designed for future multi-chain support:

```typescript
// TODO: Multi-chain support - Currently uses instance's configured chain
// Future: Allow chain selection per user

// TODO: Multi-chain support - Helper method for future use
// private detectChainFromWallet(walletAddress: string): string {
//   if (walletAddress?.startsWith('0x') && walletAddress.length === 42) {
//     return 'evm';
//   }
//   if (walletAddress?.length === 56 && walletAddress.startsWith('G')) {
//     return 'stellar';
//   }
//   return 'unknown';
// }
```

## Database Schema

### User Model
The user data is stored in the `User` table with the following structure:

```prisma
model User {
  id        Int     @id @default(autoincrement())
  uuid      String  @unique @default(uuid())
  name      String?
  gender    Gender  @default(UNKNOWN)
  email     String?
  phone     String?
  wallet    String?  // Custodial wallet address
  extras    Json?    @db.JsonB()
  notes     String?  @db.Text()
  sessionId String?

  Auth          Auth[]
  UserRole      UserRole[]
  Signup        Signup[]
  VendorProject ProjectVendors[]

  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt()
  deletedAt DateTime?
  createdBy String?
  updatedBy String?

  grievances Grievance[] @relation("UserGrievances")

  @@map("tbl_users")
}
```

### Related Models
- **Auth**: Authentication records for different services
- **UserRole**: Role assignments for users
- **Role**: System roles with permissions
- **Permission**: Granular permissions for access control

## API Endpoints

### 1. Get User Wallets
Retrieve wallet information for users:

```typescript
@Get('wallets')
@CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
getWallets(@Query() dto: ListUserDto) {
  return this.usersService.getWallets(dto);
}
```

**Endpoint**: `GET /users/wallets`

**Query Parameters**:
- `page`: Page number for pagination
- `limit`: Number of items per page
- `search`: Search term for filtering users
- `sortBy`: Field to sort by
- `sortOrder`: Sort order (asc/desc)

**Response**:
```json
[
  {
    "name": "John Doe",
    "wallet": "0x1234567890abcdef..."
  }
]
```

## Integration with @rumsan/user Package

### 1. Base Functionality
The system extends the `@rumsan/user` package to provide:

- **User CRUD Operations**: Create, read, update, delete users
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control (RBAC)
- **Event Handling**: User lifecycle events

### 2. Custom Extensions
The platform extends the base functionality with:

- **Custodial Wallet Integration**: Automatic wallet creation for new users
- **Multi-Chain Support**: Support for EVM and Stellar chains
- **Custom Controllers**: Platform-specific API endpoints

## Wallet Service Integration

### 1. Custodial Wallet Creation
When a new user is created, the system:

1. **Generates a new wallet** using the `WalletService`
2. **Associates the wallet** with the user account
3. **Stores the wallet address** in the user record

```typescript
// Create wallet using configured chain
const randomWallet = await this.walletService.createWallet();

// Associate wallet with user
userData.wallet = randomWallet.address;

// Create user with wallet
return super.create(userData);
```

### 2. Chain Configuration
The wallet service uses the instance's configured chain:

- **Single Chain per Instance**: Currently supports one chain type per instance
- **Dynamic Chain Detection**: Automatically detects chain type from configuration
- **Future Multi-Chain**: Designed for future multi-chain support

### 3. Supported Chains
- **EVM Chains**: Ethereum, Base, Polygon, etc.
- **Stellar Chain**: Stellar blockchain with Soroban smart contracts

## Security Features

### 1. Authentication
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: User session tracking
- **Token Expiration**: Automatic token expiration handling

### 2. Authorization
- **Role-Based Access Control (RBAC)**: Granular permission system
- **Ability Guards**: Action-based authorization
- **Subject-Based Permissions**: Resource-specific access control

### 3. Wallet Security
- **Custodial Management**: Platform manages private keys
- **Secure Storage**: Encrypted wallet storage
- **Access Control**: Limited wallet access to authorized users

## Usage Examples

### 1. Creating a New User
```typescript
// User data without wallet (will be auto-generated)
const userData = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890"
};

// Create user with automatic wallet generation
const newUser = await usersService.create(userData);
console.log('User created with wallet:', newUser.wallet);
```

### 2. Retrieving User Wallets
```typescript
// Get all user wallets
const wallets = await usersService.getWallets({
  page: 1,
  limit: 10,
  search: "john"
});

wallets.forEach(wallet => {
  console.log(`${wallet.name}: ${wallet.wallet}`);
});
```

### 3. User Authentication
```typescript
// Login with email/password
const authResult = await authService.login({
  email: "john@example.com",
  password: "password123"
});

// Use JWT token for API calls
const headers = {
  'Authorization': `Bearer ${authResult.token}`
};
```

## Error Handling

### 1. Wallet Creation Errors
```typescript
try {
  const user = await usersService.create(userData);
} catch (error) {
  if (error.message.includes('wallet creation')) {
    // Handle wallet creation failure
    console.error('Failed to create user wallet:', error);
  }
}
```

### 2. Authentication Errors
```typescript
try {
  const authResult = await authService.login(credentials);
} catch (error) {
  if (error.message.includes('Invalid credentials')) {
    // Handle authentication failure
    console.error('Authentication failed:', error);
  }
}
```

## Configuration

### 1. Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"

# Wallet Service
WALLET_PATH="./wallet_storage/"
```

### 2. Chain Configuration
The wallet service uses settings from the Settings service:

```typescript
// Chain settings configuration
const chainSettings = {
  chainId: "84532",
  name: "Base Sepolia",
  type: "evm",
  rpcUrl: "https://base-sepolia-rpc.publicnode.com",
  explorerUrl: "https://sepolia.basescan.org",
  currency: {
    name: "Ether",
    symbol: "ETH"
  }
};
```

## Monitoring and Logging

### 1. User Creation Logs
```typescript
console.log('Creating a new user with a random wallet address');
console.log('Random wallet created:', {
  address: randomWallet.address,
  blockchain: randomWallet.blockchain || 'detected',
});
```

### 2. Error Logging
```typescript
console.error('Error creating user wallet:', error);
```

## Future Enhancements

### 1. Multi-Chain Support
- **Dynamic Chain Selection**: Allow users to choose their preferred chain
- **Multi-Wallet Users**: Support multiple wallets per user
- **Chain Migration**: Tools for migrating between chains

### 2. Enhanced Security
- **Hardware Security Modules**: Integration with HSM for key management
- **Multi-Factor Authentication**: Additional security layers
- **Audit Logging**: Comprehensive audit trails

### 3. Advanced Features
- **Wallet Recovery**: Self-service wallet recovery mechanisms
- **Transaction History**: User transaction tracking
- **Gas Optimization**: Smart gas fee management

.
