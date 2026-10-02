# Rahat Platform - Middleware Architecture

## Overview

Rahat is a blockchain-based aid distribution platform built as an Nx monorepo with NestJS microservices. It serves as middleware connecting frontend mobile apps (like `rahat-project-aa`, `rahat-project-trigger`) to blockchain networks and off-chain services.

**Architecture Type**: Microservices + Monorepo  
**Framework**: NestJS  
**Database**: PostgreSQL + Prisma ORM  
**Blockchain**: Ethereum-compatible (Ethers.js) + Stellar  
**Message Queue**: Redis BullMQ  
**Communication**: Redis-based RPC microservices

---

## Project Structure

```
rahat-platform/
├── apps/                      # NestJS applications
│   ├── rahat/                 # Main API server (HTTP + Microservice)
│   ├── beneficiary/           # Beneficiary-facing operations (Microservice only)
│   ├── shared-auth/           # Authentication & user management (Microservice only)
│   └── contracts/             # Hardhat smart contracts
├── libs/                      # Shared libraries
│   ├── sdk/                   # Shared types, constants, DTOs
│   ├── wallet/                # Wallet management & blockchain interactions
│   ├── subgraph/              # The Graph schema definitions
│   ├── contracts/             # Contract ABIs and utilities
│   └── extensions/            # Extension DTOs and utils
├── prisma/                    # Database schema + seeds
└── tools/                     # Deployment scripts
```

---

## Applications

### 1. rahat (Main API Server)

**Port**: Configured via `PORT_RAHAT`  
**Transport**: HTTP (REST) + Redis Microservice  
**Role**: Central orchestrator, handles all project types

**Key Responsibilities**:

- Project CRUD operations
- Multi-project type routing (AA, CVA, EL, C2C, RP, AidLink)
- User authentication & permissions (CASL-based)
- Notification management
- Queue job orchestration
- Microservice communication hub

**Endpoints**:

```
POST   /v1/projects                    # Create project
GET    /v1/projects                    # List projects
POST   /v1/projects/:uuid/actions      # Project-specific actions
POST   /v1/notifications               # Create notification (global)
GET    /v1/notifications               # List notifications
```

**Microservice Commands**:

```typescript
ProjectJobs.NOTIFICATION.CREATE; // Create notification
ProjectJobs.NOTIFICATION.LIST; // List notifications
ProjectJobs.NOTIFICATION.GET; // Get single notification
```

---

### 2. beneficiary (Beneficiary Microservice)

**Transport**: Redis only  
**Role**: Handles all beneficiary operations

**Key Responsibilities**:

- Beneficiary registration & management
- Group assignment
- Disbursement tracking
- OTP generation/validation
- Wallet management

**Microservice Commands**:

```typescript
BeneficiaryJobs.ADD_TO_PROJECT;
BeneficiaryJobs.BULK_ADD_TO_PROJECT;
BeneficiaryJobs.ASSIGN_TO_PROJECT;
BeneficiaryJobs.LIST;
BeneficiaryJobs.GET_ONE_BENEFICIARY;
```

---

### 3. shared-auth (Authentication Service)

**Transport**: Redis only  
**Role**: User management, authentication, roles

**Key Responsibilities**:

- User CRUD operations
- Role management
- JWT token generation
- Password hashing
- Auth session management

---

## Database Schema (Prisma)

### Core Models

```prisma
model Project {
  id              Int           @id @default(autoincrement())
  uuid            String        @unique @default(uuid()) @db.Uuid()
  name            String
  description     String?
  status          ProjectStatus @default(NOT_READY) // NOT_READY, ACTIVE, CLOSED
  type            String         // AA, CVA, EL, C2C, RP, AidLink
  contractAddress String?
  extras          Json?         @db.JsonB()

  notifications   Notification[]
  BeneficiaryProject BeneficiaryProject[]
}

model Notification {
  id          Int      @id @default(autoincrement())
  title       String
  projectId   String?  @db.Uuid()  // Optional: null = global notification
  project     Project? @relation(fields: [projectId], references: [uuid])
  description String
  group       String           // e.g., "project", "beneficiary", "transaction"
  createdAt   DateTime @default(now())
  notify      Boolean  @default(false)  // If true, sends email notification
}

model Beneficiary {
  id        Int       @id @default(autoincrement())
  uuid      String    @unique @default(uuid()) @db.Uuid()
  wallet    String?   // Blockchain wallet address
  extras    Json?     @db.JsonB()

  Pii       BeneficiaryPii?
  Project   BeneficiaryProject[]
}

model User {
  id        Int       @id @default(autoincrement())
  email     String?   @unique
  phone     String?   @unique
  name      String
  wallet    String?   // Wallet address for vendor users
  extras    Json?     @db.JsonB()

  UserRole  UserRole[]
}

model Role {
  id        Int       @id @default(autoincrement())
  name      String    @unique  // Admin, Manager, Vendor, AidLinkProjectManager
  UserRole  UserRole[]
}
```

---

## Notification Flow

### Architecture

```
Frontend Mobile App (rahat-project-aa, etc.)
         ↓ (HTTP POST /v1/notifications)
    rahat API Server
         ↓
   NotificationService.createNotification()
         ↓
   Prisma: Save to tbl_notifications
         ↓
   If notify=true → Add job to Redis Bull queue (RAHAT)
         ↓
   RahatProcessor.sendNotifyEmail() processes queue
         ↓
   EmailService.sendEmail() → SMTP delivery
```

### Notification Types

1. **System Notifications** (Stored in DB)

   - Project creation/update
   - Disbursement initiation/completion
   - Vendor registration
   - User management changes

2. **Email Notifications** (Queued via BullMQ)
   - Sent to Admin/Manager roles
   - HTML email templates with project links
   - Retry logic (3 attempts, exponential backoff)

### Notification API Endpoints

```typescript
// Create notification (global or project-specific)
POST /v1/notifications
{
  "title": "New Disbursement",
  "description": "500 USDC distributed to 100 beneficiaries",
  "group": "transaction",
  "projectId": "uuid-here",  // Optional
  "notify": true            // If true, sends email to admins
}

// List notifications (with pagination)
GET /v1/notifications?page=1&perPage=20&projectId=xxx&group=xxx

// Get single notification
GET /v1/notifications/:id
```

### Notification Service Code Flow

```typescript
// apps/rahat/src/notification/notification.service.ts

async createNotification(dto: CreateNotificationDto) {
  // 1. Save to database
  const notification = await this.prisma.notification.create({
    data: { ...dto, createdAt: new Date() }
  });

  // 2. If notify=true, queue email job
  if (notification.notify) {
    this.notifyUsers(notification);
  }

  return notification;
}

private async notifyUsers(notification: Notification) {
  // 1. Find all Admin/Manager users
  const users = await this.prisma.user.findMany({
    where: {
      UserRole: { some: { Role: { name: { in: ['Admin', 'Manager'] } } } }
    }
  });

  // 2. Extract emails
  const usersEmail = users.map(user => user.email);

  // 3. Queue email job
  await this.rahatQueue.add(APP_JOBS.NOTIFY, {
    usersEmail,
    subject: notification.title,
    text: notification.description
  }, {
    attempts: 3,
    removeOnComplete: true,
    backoff: { type: 'exponential', delay: 1000 }
  });
}
```

---

## Project Flow

### Project Lifecycle

```mermaid
graph TD
    A[Create Project] --> B[Project Setup]
    B --> C[Configure Settings]
    C --> D[Deploy Smart Contracts]
    D --> E[Activate Project]
    E --> F[Beneficiary Onboarding]
    F --> G[Disbursement Cycles]
    G --> H{Project Status}
    H -->|Active| G
    H -->|Closed| I[View Only Mode]
```

### Project Creation Flow

```typescript
// 1. HTTP POST /v1/projects
{
  "name": "AA Kenya Project",
  "type": "AA",
  "description": "Emergency assistance in Kenya"
}

// 2. ProjectService.create() → Save to DB + Emit event
this.eventEmitter.emit(ProjectEvents.PROJECT_CREATED, project);

// 3. Event listeners trigger:
//    - Contract deployment (if auto-deploy enabled)
//    - Settings seeding
//    - Initial data setup

// 4. Return project with UUID
{
  "id": 1,
  "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "AA Kenya Project",
  "type": "AA",
  "status": "NOT_READY"
}
```

### Project Actions Flow

```typescript
// Frontend calls project-specific action
POST /v1/projects/:uuid/actions
{
  "action": "aa.chain.disburse",
  "payload": {
    "amount": "1000",
    "tokenAddress": "0x...",
    "beneficiaries": ["addr1", "addr2"]
  }
}

// ProjectController.msActions() → ProjectService.handleProjectActions()
const actions = {
  ...aaActions,
  ...cvaActions,
  ...elActions,
  // ... other project type actions
};

// Action handler executes:
// 1. Validate payload
// 2. Call appropriate microservice (rahat/beneficiary/wallet)
// 3. Return result to frontend
```

---

## Interconnected Projects

### Project Types & Their Handlers

| Project Type                 | Actions Namespace | Handler Location                                     |
| ---------------------------- | ----------------- | ---------------------------------------------------- |
| AA (AidAccess)               | `aa.*`            | `apps/rahat/src/projects/actions/aa.action.ts`       |
| CVA (Cash+Voucher)           | `cva.*`           | `apps/rahat/src/projects/actions/cva.action.ts`      |
| EL (Emergency Liquidity)     | `elProject.*`     | `apps/rahat/src/projects/actions/el.action.ts`       |
| C2C (Community-to-Community) | `c2cProject.*`    | `apps/rahat/src/projects/actions/c2c.action.ts`      |
| RP (Resilience Project)      | `rpProject.*`     | `apps/rahat/src/projects/actions/rp.action.ts`       |
| AidLink                      | `aidlink.*`       | `apps/rahat/src/projects/actions/aid-link.action.ts` |

### Microservice Communication

```typescript
// rahat → beneficiary communication
this.client.send({ cmd: BeneficiaryJobs.ADD_TO_PROJECT }, { dto: payload, projectUid: uuid }).pipe(timeout(MS_TIMEOUT));

// rahat → wallet communication
this.walletService.createWallet(); // Uses ethers.js/stellar-sdk

// Queue jobs
await this.rahatQueue.add(BQUEUE.RAHAT, jobData);
```

---

## Push Notification Implementation (Firebase Cloud Messaging)

### Current State

**Notification System**: Email-only via SMTP  
**Missing**: Mobile push notifications (FCM)

### Where to Add FCM Backend Code

#### 1. Database Layer (`prisma/schema.prisma`)

```prisma
model Device {
  id        Int      @id @default(autoincrement())
  userId    String   // UUID of user
  token     String   @unique  // FCM device token
  platform  String   // ios, android
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  User User @relation(fields: [userId], references: [uuid])
}
```

#### 2. Notification Service Enhancement (`apps/rahat/src/notification/notification.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { FirebaseAdmin } from '@rumsan/firebase'; // New dependency

@Injectable()
export class NotificationService {
  constructor(private readonly firebase: FirebaseAdmin) // ... existing dependencies
  {}

  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: { ...dto, createdAt: new Date() },
    });

    if (notification.notify) {
      // Send to email
      this.notifyUsersViaEmail(notification);

      // NEW: Send push notifications to mobile devices
      this.notifyUsersViaPush(notification);
    }

    return notification;
  }

  private async notifyUsersViaPush(notification: Notification) {
    // Get all active devices for Admin/Manager users
    const devices = await this.prisma.device.findMany({
      where: {
        active: true,
        User: {
          UserRole: {
            some: {
              Role: { name: { in: ['Admin', 'Manager'] } },
            },
          },
        },
      },
    });

    if (devices.length === 0) return;

    const tokens = devices.map((d) => d.token);

    await this.firebase.sendBulk({
      tokens,
      notification: {
        title: notification.title,
        body: notification.description,
      },
      data: {
        groupId: notification.group,
        projectId: notification.projectId || '',
        notificationId: notification.id.toString(),
      },
    });
  }
}
```

#### 3. New FCM Module (`apps/rahat/src/firebase/`)

```typescript
// apps/rahat/src/firebase/firebase.module.ts
import { Module } from '@nestjs/common';
import { FirebaseAdmin } from './firebase.admin';

@Module({
  providers: [FirebaseAdmin],
  exports: [FirebaseAdmin],
})
export class FirebaseModule {}
```

```typescript
// apps/rahat/src/firebase/firebase.admin.ts
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdmin {
  private readonly app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  async sendBulk(payload: { tokens: string[]; notification: { title: string; body: string }; data?: Record<string, string> }) {
    const message = {
      tokens: payload.tokens,
      notification: payload.notification,
      data: payload.data,
    };

    try {
      return await this.app.messaging().sendMulticast(message);
    } catch (error) {
      console.error('FCM Error:', error);
      throw error;
    }
  }
}
```

#### 4. Device Management Endpoints (`apps/rahat/src/devices/`)

```typescript
// apps/rahat/src/devices/devices.controller.ts
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async register(@Body() dto: RegisterDeviceDto, @Req() req) {
    return this.devicesService.register(req.user.uuid, dto);
  }

  @Delete(':id')
  async unregister(@Param('id') id: number) {
    return this.devicesService.unregister(id);
  }
}
```

#### 5. Environment Variables (`.env`)

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=rahat-platform-12345
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@rahat-platform-12345.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"
```

---

## Queue System (Redis BullMQ)

### Job Queues

```typescript
BQUEUE.RAHAT; // General notifications, emails
BQUEUE.META_TXN; // Meta-transaction processing
BQUEUE.RAHAT_PROJECT; // Project-specific jobs
BQUEUE.RAHAT_IMPORT; // Data import jobs
```

### Job Processing

```typescript
@Processor(BQUEUE.RAHAT)
export class RahatProcessor {
  @Process(APP_JOBS.NOTIFY)
  async sendNotifyEmail(job: Job<any>) {
    // Process email notification from queue
  }
}
```

---

## Authentication & Authorization

### JWT-Based Auth

```typescript
// Protected endpoints require:
@UseGuards(JwtGuard, AbilitiesGuard)
@CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
```

### CASL Permissions

```typescript
// Roles: Admin, Manager, User, Vendor, AidLinkProjectManager
// Subjects: all, beneficiary, project, vendor, public
// Actions: manage, create, update, delete, read
```

---

## Deployment

### Local Development

```bash
# Bootstrap Docker containers + DB + seeds
pnpm bootstrap

# Start rahat API server
pnpm rahat

# Start beneficiary microservice
pnpm beneficiary

# Database management
pnpm migrate:dev      # Create migration
pnpm prisma:studio    # Open Prisma Studio
```

### Production Deployment

```bash
# Build all apps
pnpm build:all

# Deploy contracts (Hardhat)
cd libs/contracts && hardhat deploy --network mainnet

# Deploy subgraph (The Graph)
cd apps/graph && graph deploy rahat/core
```

---

## Key Constants & Enums

### Project Status

```typescript
enum ProjectStatus {
  NOT_READY, // Initial state
  ACTIVE, // Operational
  CLOSED, // Read-only mode
}
```

### Notification Groups

```typescript
// Common groups: "project", "beneficiary", "transaction",
// "user_management", "system"
```

---

## Development Workflow

1. **Add new API endpoint**: `nx g @nx/nest:resource --directory=apps/rahat/src/my-resource`
2. **Database changes**: Update `prisma/schema.prisma` → `pnpm migrate:dev`
3. **Microservice command**: Add to `libs/sdk/src/constants/index.ts`
4. **Project action handler**: Add to `apps/rahat/src/projects/actions/*.action.ts`

---

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Bruno API tests
pnpm bruno:test
```

---

## Summary

**Rahat Platform** is a middleware layer that:

- Connects frontend mobile apps to blockchain networks
- Manages multiple project types (AA, CVA, EL, etc.)
- Handles notifications via email + (to be added) FCM push
- Uses Redis BullMQ for async job processing
- Stores data in PostgreSQL with Prisma ORM

**To implement FCM push notifications**, add:

1. Device model to schema
2. FirebaseAdmin service
3. Push notification handler in NotificationService
4. Device registration endpoints
5. Environment variables for Firebase credentials
