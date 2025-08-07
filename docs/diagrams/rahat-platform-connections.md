# Rahat Platform Connections & Microservice Architecture

## Overview

This document details the connections and communication patterns between the Rahat Core Platform and its various project deployments, including database connections, microservice communications, and data flow patterns.

## Architecture Layers

### 1. Core Platform Layer

The Rahat Core Platform serves as the central orchestrator with the following key components:

#### Core Services
- **Beneficiary Service** (`apps/beneficiary/`)
- **Project Service** (`apps/rahat/src/projects/`)
- **Queue Service** (`apps/rahat/src/queue/`)
- **Wallet Service** (`apps/rahat/src/wallet/`)
- **Token Service** (`apps/rahat/src/token/`)
- **Offramp Service** (`apps/rahat/src/offramp/`)

#### Shared Libraries (`libs/`)
- **SDK** (`libs/sdk/`) - Shared client libraries
- **Stats** (`libs/stats/`) - Analytics and reporting
- **Wallet** (`libs/wallet/`) - Wallet management utilities
- **Extensions** (`libs/extensions/`) - Common extensions and utilities

## Database Connections

### Primary Database (PostgreSQL)

```mermaid
graph TD
    A[Rahat Core Platform] --> B[PostgreSQL Database]
    C[Beneficiary Service] --> B
    D[Project Service] --> B
    E[Queue Service] --> B
    F[Wallet Service] --> B
    
    B --> G[Prisma ORM]
    G --> H[Database Migrations]
    G --> I[Schema Management]
```

#### Database Schema Components:
- **Beneficiaries** - User and beneficiary data
- **Projects** - Project configurations and settings
- **Tokens** - Token management and transactions
- **Wallets** - Wallet addresses and balances
- **Queues** - Job queue management
- **Settings** - Application settings and configurations

### Redis Cache Layer

```mermaid
graph TD
    A[Rahat Core Platform] --> B[Redis Cache]
    C[Beneficiary Service] --> B
    D[Project Service] --> B
    E[Queue Service] --> B
    
    B --> F[Session Management]
    B --> G[Job Queues]
    B --> H[Cache Storage]
    B --> I[Pub/Sub Messaging]
```

#### Redis Usage:
- **Session Storage** - User sessions and authentication
- **Job Queues** - Bull queue management
- **Cache** - Frequently accessed data
- **Pub/Sub** - Inter-service communication

## Microservice Communications

### 1. Internal Service Communication

#### REST API Communication
```mermaid
graph LR
    A[Core Platform] --> B[Beneficiary Service]
    A --> C[Project Service]
    A --> D[Queue Service]
    A --> E[Wallet Service]
    
    B --> F[Database]
    C --> F
    D --> F
    E --> F
```

#### Microservice Communication Patterns:

##### HTTP/REST Communication
```typescript
// Example: Core Platform to Beneficiary Service
@Injectable()
export class BeneficiaryService {
  constructor(
    @Inject('BENEFICIARY_SERVICE') private client: ClientProxy
  ) {}

  async createBeneficiary(data: CreateBeneficiaryDto) {
    return this.client.send('beneficiary.create', data);
  }
}
```

##### Redis-based Communication
```typescript
// Example: Queue Service Communication
@Injectable()
export class QueueService {
  constructor(
    @Inject('REDIS_CLIENT') private redisClient: Redis
  ) {}

  async publishEvent(event: string, data: any) {
    await this.redisClient.publish(event, JSON.stringify(data));
  }
}
```

### 2. External Service Communication

#### Blockchain Communication
```mermaid
graph TD
    A[Rahat Core Platform] --> B[Smart Contracts]
    B --> C[RahatToken]
    B --> D[RahatTreasury]
    B --> E[ERC2771 Forwarder]
    
    A --> F[Graph Node]
    F --> G[Subgraph Indexing]
    
    A --> H[IPFS]
    H --> I[File Storage]
```

#### External API Communication
```typescript
// Example: External API Integration
@Injectable()
export class ExternalService {
  async connectToVendor(vendorConfig: VendorConfig) {
    return this.httpClient.post(
      `${vendorConfig.endpoint}/connect`,
      vendorConfig.credentials
    );
  }
}
```

## Project Deployment Connections

### 1. Project-EL (Emergency Livelihood)

```mermaid
graph TD
    A[Project-EL] --> B[Core Platform]
    A --> C[EL Database]
    A --> D[EL Smart Contracts]
    
    B --> E[Shared Services]
    C --> F[EL Beneficiaries]
    D --> G[EL Token Distribution]
```

**Connections:**
- **Database**: Separate EL database with shared schema
- **Smart Contracts**: EL-specific token contracts
- **Services**: Uses core beneficiary and wallet services
- **External**: UNICEF integration for beneficiary data

### 2. Project-AA (Accountable Aid)

```mermaid
graph TD
    A[Project-AA] --> B[Core Platform]
    A --> C[AA Database]
    A --> D[AA Smart Contracts]
    
    B --> E[Shared Services]
    C --> F[AA Beneficiaries]
    D --> G[AA Token Distribution]
```

**Connections:**
- **Database**: Separate AA database with shared schema
- **Smart Contracts**: AA-specific token contracts
- **Services**: Uses core project and queue services
- **External**: DRC integration for aid distribution

### 3. Project-RFV (Rapid Food Vouchers)

```mermaid
graph TD
    A[Project-RFV] --> B[Core Platform]
    A --> C[RFV Database]
    A --> D[RFV Smart Contracts]
    
    B --> E[Shared Services]
    C --> F[RFV Beneficiaries]
    D --> G[RFV Token Distribution]
```

**Connections:**
- **Database**: Separate RFV database with shared schema
- **Smart Contracts**: RFV-specific token contracts
- **Services**: Uses core token and offramp services
- **External**: Vendor system integration for food vouchers

### 4. Project-C2C (Cash to Cash)

```mermaid
graph TD
    A[Project-C2C] --> B[Core Platform]
    A --> C[C2C Database]
    A --> D[C2C Smart Contracts]
    
    B --> E[Shared Services]
    C --> F[C2C Beneficiaries]
    D --> G[C2C Token Distribution]
```

**Connections:**
- **Database**: Separate C2C database with shared schema
- **Smart Contracts**: C2C-specific token contracts
- **Services**: Uses core wallet and offramp services
- **External**: Offramp service integration for cash distribution

## Data Flow Patterns

### 1. Beneficiary Registration Flow

```mermaid
sequenceDiagram
    participant CP as Core Platform
    participant BS as Beneficiary Service
    participant DB as Database
    participant BC as Blockchain
    participant WS as Wallet Service
    
    CP->>BS: Register Beneficiary
    BS->>DB: Store Beneficiary Data
    BS->>WS: Create Wallet
    WS->>BC: Deploy Wallet Contract
    BC-->>WS: Wallet Address
    WS->>DB: Store Wallet Info
    BS-->>CP: Registration Complete
```

### 2. Token Distribution Flow

```mermaid
sequenceDiagram
    participant CP as Core Platform
    participant TS as Token Service
    participant QS as Queue Service
    participant BC as Blockchain
    participant WS as Wallet Service
    
    CP->>TS: Distribute Tokens
    TS->>QS: Queue Distribution Job
    QS->>BC: Execute Smart Contract
    BC->>WS: Transfer Tokens
    WS->>BC: Confirm Transaction
    BC-->>QS: Transaction Hash
    QS-->>TS: Distribution Complete
    TS-->>CP: Distribution Status
```

### 3. Project Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant NX as Nx Monorepo
    participant Docker as Docker Compose
    participant DB as Database
    participant BC as Blockchain
    
    Dev->>NX: Deploy Project
    NX->>Docker: Build Containers
    Docker->>DB: Setup Database
    Docker->>BC: Deploy Contracts
    BC-->>Docker: Contract Addresses
    Docker->>DB: Store Contract Info
    Docker-->>NX: Deployment Complete
    NX-->>Dev: Project Ready
```

## Communication Protocols

### 1. HTTP/REST APIs

```typescript
// Core Platform API Endpoints
@Controller('v1')
export class AppController {
  @Post('beneficiaries')
  async createBeneficiary(@Body() data: CreateBeneficiaryDto) {
    return this.beneficiaryService.create(data);
  }

  @Post('projects')
  async createProject(@Body() data: CreateProjectDto) {
    return this.projectService.create(data);
  }

  @Post('tokens/distribute')
  async distributeTokens(@Body() data: DistributeTokensDto) {
    return this.tokenService.distribute(data);
  }
}
```

### 2. GraphQL Subgraph

```graphql
# Subgraph Schema
type Beneficiary @entity {
  id: ID!
  walletAddress: String!
  projectId: String!
  tokens: [Token!]! @derivedFrom(field: "beneficiary")
}

type Token @entity {
  id: ID!
  beneficiary: Beneficiary!
  amount: BigInt!
  transactionHash: String!
}
```

### 3. Redis Pub/Sub

```typescript
// Event Publishing
@Injectable()
export class EventService {
  async publishBeneficiaryCreated(beneficiary: Beneficiary) {
    await this.redis.publish('beneficiary.created', JSON.stringify(beneficiary));
  }

  async publishTokenDistributed(token: Token) {
    await this.redis.publish('token.distributed', JSON.stringify(token));
  }
}
```

## Security & Authentication

### 1. JWT Authentication

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    return this.validateToken(token);
  }
}
```

### 2. External App Authentication

```typescript
@Injectable()
export class ExternalAppGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    return this.validateApiKey(apiKey);
  }
}
```

## Monitoring & Logging

### 1. Service Health Checks

```typescript
@Controller('health')
export class HealthController {
  @Get()
  async checkHealth() {
    return {
      status: 'healthy',
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        blockchain: await this.checkBlockchain()
      }
    };
  }
}
```

### 2. Queue Monitoring

```typescript
@Injectable()
export class QueueMonitorService {
  async getQueueStats() {
    const queues = ['RAHAT', 'RAHAT_BENEFICIARY', 'META_TXN'];
    return Promise.all(
      queues.map(async (queue) => ({
        name: queue,
        waiting: await this.bull.getWaiting(queue),
        active: await this.bull.getActive(queue),
        completed: await this.bull.getCompleted(queue)
      }))
    );
  }
}
```

## Configuration Management

### 1. Environment Variables

```bash
# Core Platform Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/rahat

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
CONTRACT_ADDRESSES={"token":"0x...","treasury":"0x..."}

# Project-specific Configuration
PROJECT_EL_DATABASE_URL=postgresql://user:password@localhost:5432/el
PROJECT_AA_DATABASE_URL=postgresql://user:password@localhost:5432/aa
```

### 2. Service Discovery

```typescript
@Injectable()
export class ServiceDiscoveryService {
  async discoverServices() {
    return {
      beneficiary: await this.discoverService('BENEFICIARY_SERVICE'),
      project: await this.discoverService('PROJECT_SERVICE'),
      queue: await this.discoverService('QUEUE_SERVICE')
    };
  }
}
```

## Error Handling & Resilience

### 1. Circuit Breaker Pattern

```typescript
@Injectable()
export class ResilientService {
  @CircuitBreaker({
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
  })
  async callExternalService(data: any) {
    return this.httpClient.post('/external-api', data);
  }
}
```

### 2. Retry Logic

```typescript
@Injectable()
export class RetryService {
  @Retry({ attempts: 3, delay: 1000 })
  async processJob(job: Job) {
    return this.processJobWithRetry(job);
  }
}
```

This document provides a comprehensive overview of how the Rahat Core Platform connects with its various project deployments, including detailed information about database connections, microservice communications, and data flow patterns. 