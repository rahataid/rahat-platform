# Beneficiary Management Microservice

## Overview

The Beneficiary Management microservice is a dedicated service within the Rahat platform that handles all beneficiary-related CRUD operations. It operates as a microservice using Redis for inter-service communication and provides comprehensive beneficiary management capabilities.

## Architecture

### Service Type
- **Microservice**: Built using NestJS microservices with Redis transport
- **Communication**: Uses Redis for inter-service communication via message patterns
- **Database**: Uses Prisma ORM with PostgreSQL
- **Queue Processing**: Integrates with Bull queues for background job processing
- **Event-Driven**: Uses EventEmitter for internal event handling

### Key Components

#### 1. Main Application (`main.ts`)
```typescript
// Microservice configuration with Redis transport
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.REDIS,
    options: {
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      password: configService.get('REDIS_PASSWORD'),
      retryAttempts: 20,
      retryDelay: 3000,
    },
  }
);
```

#### 2. Core Modules
- **BeneficiaryModule**: Main business logic for beneficiary operations
- **ListenersModule**: Event listeners for beneficiary-related events
- **ProcessorsModule**: Background job processors
- **SettingsModule**: Configuration management

## CRUD Operations

### 1. Create Operations

#### Single Beneficiary Creation
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.CREATE })
async create(@Payload() createBeneficiaryDto: CreateBeneficiaryDto)
```

#### Bulk Beneficiary Creation
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.CREATE_BULK })
createBulk(@Payload() data)

@MessagePattern({ cmd: BeneficiaryJobs.IMPORT_BENEFICIARY_LARGE_QUEUE })
createBulkWithQueue(@Payload() queueData)
```

### 2. Read Operations

#### Individual Beneficiary Retrieval
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.GET })
async getBeneficiary(uuid: UUID)

@MessagePattern({ cmd: BeneficiaryJobs.GET_BY_WALLET })
async getBeneficiaryByWallet(wallet: string)

@MessagePattern({ cmd: BeneficiaryJobs.GET_BY_PHONE })
async getBeneficiaryByPhone(phone: string)
```

#### Bulk Beneficiary Retrieval
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.GET_BULK_BY_WALLET })
async getBulkBeneficiaryByWallet(wallet: string[])

@MessagePattern({ cmd: BeneficiaryJobs.FIND_PHONE_BY_UUID })
async findPhoneByUUID(uuid: UUID[])
```

#### Listing and Filtering
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.LIST })
async list(dto: ListBeneficiaryDto)

@MessagePattern({ cmd: BeneficiaryJobs.LIST_BY_PROJECT })
async listByProject(data: any)

@MessagePattern({ cmd: BeneficiaryJobs.LIST_PII })
async listPiiData(dto: any)
```

### 3. Update Operations

#### Beneficiary Updates
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.UPDATE })
update(@Param('uuid') uuid: UUID, @Payload() dto: UpdateBeneficiaryDto)
```

#### Group Updates
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.UPDATE_GROUP })
updateGroup(@Param('uuid') uuid: UUID, @Payload() dto: UpdateBeneficiaryGroupDto)
```

### 4. Delete Operations

#### Beneficiary Deletion
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.DELETE })
delete(payload: any)

@MessagePattern({ cmd: BeneficiaryJobs.REMOVE })
async remove(payload: any)

@MessagePattern({ cmd: BeneficiaryJobs.DELETE_BENEFICIARY_AND_PII })
async deleteBenefAndPii(payload: any)
```

#### Group Deletion
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.REMOVE_ONE_GROUP })
removeGroup(uuid: string)

@MessagePattern({ cmd: BeneficiaryJobs.DELETE_ONE_GROUP })
deleteGroup(uuid: string)
```

## Project Management

### Adding Beneficiaries to Projects
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.ADD_TO_PROJECT })
async addToProject(payload: any)

@MessagePattern({ cmd: BeneficiaryJobs.BULK_ADD_TO_PROJECT })
async bulkaddToProject(payload: addBulkBeneficiaryToProject)

@MessagePattern({ cmd: BeneficiaryJobs.ASSIGN_TO_PROJECT })
async assignToProject(payload: any)

@MessagePattern({ cmd: BeneficiaryJobs.BULK_ASSIGN_TO_PROJECT })
async bulkAssignToProject(payload: any)
```

### Group Management
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.ADD_GROUP })
addGroup(payload: CreateBeneficiaryGroupsDto)

@MessagePattern({ cmd: BeneficiaryJobs.GET_ALL_GROUPS })
getAllGroups(dto: ListBeneficiaryGroupDto)

@MessagePattern({ cmd: BeneficiaryJobs.ASSIGN_GROUP_TO_PROJECT })
async assignGroupToProject(payload: any)
```

## Verification and Security

### Wallet Validation
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.VALIDATE_WALLET })
validateWallet(validationData: ValidateWallet)

@MessagePattern({ cmd: BeneficiaryJobs.VERIFY_SIGNATURE })
verifySignature(verificationData: any)
```

### Link Generation
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.GENERATE_LINK })
generateLink(uuid: UUID)
```

## Statistics and Analytics

### General Statistics
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.STATS })
async stats()

@MessagePattern({ cmd: BeneficiaryJobs.GET_TABLE_STATS })
getTableStats()

@MessagePattern({ cmd: BeneficiaryJobs.GET_ALL_STATS })
async getAllStats()
```

### Project-Specific Statistics
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.PROJECT_STATS })
async projectStats(uuid: string)

@MessagePattern({ cmd: BeneficiaryJobs.GET_STATS })
async getProjectStats(data: any)

@MessagePattern({ cmd: BeneficiaryJobs.CALCULATE_STATS })
async syncProjectStats(payload)
```

## Import and Export Features

### Temporary Beneficiary Management
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.LIST_TEMP_BENEFICIARY })
async listTempBeneficiaries(data: any)

@MessagePattern({ cmd: BeneficiaryJobs.LIST_TEMP_GROUPS })
async listTempGroups(query: ListTempGroupsDto)

@MessagePattern({ cmd: BeneficiaryJobs.IMPORT_TEMP_BENEFICIARIES })
async importTempBeneficiary(data: ImportTempBenefDto)
```

### Community Tool Integration
```typescript
@MessagePattern({ cmd: BeneficiaryJobs.IMPORT_BENEFICIARIES_FROM_COMMUNITY_TOOL })
async importBeneficiariesFromTool(data: any)
```

## Background Processing

### Queue Management
The service integrates with Bull queues for handling large-scale operations:

- **RAHAT_BENEFICIARY**: Main queue for beneficiary operations
- **Batch Processing**: Handles bulk operations with configurable batch sizes
- **Error Handling**: Comprehensive error handling with retry mechanisms

### Processors
Located in `src/processors/`:
- **beneficiary.processor.ts**: Handles background beneficiary processing
- **processor.utils.ts**: Utility functions for processing operations

### Consumers
Located in `src/consumers/`:
- **beneficiary.consumer.ts**: Main consumer for beneficiary operations
- **target.export.rabbitmq.worker.ts**: Handles target export operations

## Data Models

### Core Entities
- **Beneficiary**: Main beneficiary entity with PII separation
- **BeneficiaryPii**: Personal Identifiable Information
- **BeneficiaryProject**: Project assignments
- **BeneficiaryGroups**: Group management
- **GroupPurpose**: Group purpose definitions

### PII Handling
The service implements PII (Personal Identifiable Information) separation:
- Sensitive data is stored separately in `BeneficiaryPii` table
- Non-PII data is stored in the main `Beneficiary` table
- Data sanitization utilities are provided

## PII Data Considerations

### PII Data Architecture

#### Data Separation Strategy
The beneficiary microservice implements a robust PII data separation strategy:

```typescript
// PII data structure
interface BeneficiaryPii {
  uuid: string;
  beneficiaryId: string;
  name: string;           // Full name
  phone: string;          // Phone number
  email: string;          // Email address
  extras: {
    govtIDNumber: string; // Government ID
    // Other sensitive fields
  };
  createdAt: Date;
  updatedAt: Date;
}

// Non-PII data structure
interface Beneficiary {
  uuid: string;
  walletAddress: string;
  age: number;
  gender: string;
  type: string;
  isVerified: boolean;
  // Other non-sensitive fields
}
```

#### PII Data Processing Utilities

The service provides specialized utilities for PII handling:

```typescript
// From helpers/index.ts
export const splitBeneficiaryPII = (beneficiary: any) => {
  const { firstName, lastName, phone, email, govtIDNumber, archived, deletedAt, ...rest } = beneficiary;
  const piiData = {
    name: `${beneficiary.firstName} ${beneficiary.lastName}`,
    phone: phone || '',
    email: email || '',
    extras: {
      govtIDNumber: govtIDNumber || ''
    }
  }
  const sanitized = sanitizeBeneficiaryPayload(rest);
  return { piiData, nonPii: sanitized }
}
```

### PII Data Security Measures

#### 1. Encryption at Rest
- **AES-256-CBC Encryption**: PII data is encrypted using AES-256-CBC
- **Key Management**: Private keys are managed through environment variables
- **IV Handling**: Unique initialization vectors for each encryption operation

```typescript
// From verification.service.ts
private readonly algorithm = 'aes-256-cbc'
private readonly privateKey = this.configService.get('PRIVATE_KEY')
private iv = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex')

encrypt(data) {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.getSecret()), this.iv);
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    return encryptedData;
}
```

#### 2. Data Access Controls
- **Role-Based Access**: Different access levels for PII vs non-PII data
- **Audit Logging**: All PII data access is logged for compliance
- **Time-Limited Access**: Temporary access tokens for PII data retrieval

#### 3. Data Minimization
- **Selective Exposure**: Only necessary PII fields are exposed in responses
- **Field-Level Encryption**: Individual sensitive fields can be encrypted separately
- **Anonymization**: PII data can be anonymized for analytics purposes

### PII Data Operations

#### 1. PII-Specific CRUD Operations

```typescript
// PII data retrieval with encryption
@MessagePattern({ cmd: BeneficiaryJobs.LIST_PII })
async listPiiData(dto: any) {
  // Returns encrypted PII data with access controls
  return this.service.listPiiData(dto);
}

// PII data update with validation
async updatePIIByBenefUUID(benefUUID: UUID, piiData: TPIIData) {
  // Validates and encrypts PII data before storage
  return this.prisma.beneficiaryPii.update({
    where: { beneficiaryId: benefUUID },
    data: piiData
  });
}

// PII data deletion with cleanup
async deletePIIByBenefUUID(benefUUID: UUID) {
  // Securely removes PII data with audit trail
  return this.prisma.beneficiaryPii.delete({
    where: { beneficiaryId: benefUUID }
  });
}
```

#### 2. PII Data Validation

```typescript
// PII data validation utilities
const validatePIIData = (piiData: any) => {
  const requiredFields = ['name', 'phone'];
  const missingFields = requiredFields.filter(field => !piiData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required PII fields: ${missingFields.join(', ')}`);
  }
  
  // Validate phone number format
  if (piiData.phone && !isValidPhoneNumber(piiData.phone)) {
    throw new Error('Invalid phone number format');
  }
  
  // Validate email format
  if (piiData.email && !isValidEmail(piiData.email)) {
    throw new Error('Invalid email format');
  }
  
  return true;
};
```

### PII Data Compliance

#### 1. GDPR Compliance
- **Right to be Forgotten**: Complete PII data deletion capability
- **Data Portability**: Export PII data in standard formats
- **Consent Management**: Track and manage PII data consent
- **Data Retention**: Configurable retention policies for PII data

#### 2. Data Privacy Controls
- **Consent Tracking**: Monitor user consent for PII data processing
- **Purpose Limitation**: Restrict PII data usage to specific purposes
- **Data Subject Rights**: Support for data subject access requests

```typescript
// GDPR compliance utilities
async handleDataSubjectRequest(beneficiaryId: string, requestType: 'access' | 'deletion' | 'portability') {
  switch (requestType) {
    case 'access':
      return this.getPIIDataForSubject(beneficiaryId);
    case 'deletion':
      return this.deletePIIDataForSubject(beneficiaryId);
    case 'portability':
      return this.exportPIIDataForSubject(beneficiaryId);
  }
}
```

### PII Data Analytics

#### 1. Anonymized Analytics
- **Aggregated Statistics**: PII data is aggregated for analytics
- **Pseudonymization**: Personal identifiers are replaced with pseudonyms
- **Statistical Analysis**: Safe statistical analysis without individual identification

```typescript
// Anonymized statistics generation
async generateAnonymizedStats(projectId: string) {
  const stats = await this.prisma.beneficiary.groupBy({
    by: ['age', 'gender'],
    _count: { uuid: true },
    where: { 
      projects: { some: { projectId } }
    }
  });
  
  return stats.map(stat => ({
    ageGroup: stat.age,
    gender: stat.gender,
    count: stat._count.uuid
  }));
}
```

#### 2. Privacy-Preserving Analytics
- **Differential Privacy**: Statistical noise addition for privacy protection
- **K-Anonymity**: Ensuring at least K individuals share the same attributes
- **Data Masking**: Sensitive data masking for analytics

### PII Data Monitoring

#### 1. Access Monitoring
- **Access Logs**: Track all PII data access attempts
- **Anomaly Detection**: Detect unusual access patterns
- **Alert System**: Notify administrators of suspicious activities

#### 2. Data Quality Monitoring
- **Data Completeness**: Monitor PII data completeness rates
- **Data Accuracy**: Validate PII data accuracy
- **Data Freshness**: Track PII data update frequency

### PII Data Backup and Recovery

#### 1. Secure Backup
- **Encrypted Backups**: All PII data backups are encrypted
- **Geographic Distribution**: Backups stored in multiple locations
- **Access Controls**: Strict access controls for backup data

#### 2. Disaster Recovery
- **Recovery Procedures**: Documented procedures for PII data recovery
- **Testing**: Regular testing of PII data recovery procedures
- **Compliance**: Recovery procedures comply with data protection regulations

### PII Data Integration Considerations

#### 1. External System Integration
- **API Security**: Secure APIs for PII data exchange
- **Data Mapping**: Clear mapping of PII data fields
- **Consent Propagation**: Propagate consent across integrated systems

#### 2. Third-Party Services
- **Vendor Assessment**: Assess third-party PII data handling
- **Data Processing Agreements**: Clear agreements for PII data processing
- **Audit Rights**: Right to audit third-party PII data handling

### Best Practices for PII Data Handling

1. **Minimize Collection**: Only collect necessary PII data
2. **Secure Storage**: Use encryption for PII data at rest and in transit
3. **Access Control**: Implement strict access controls for PII data
4. **Regular Audits**: Conduct regular PII data handling audits
5. **Staff Training**: Train staff on PII data handling procedures
6. **Incident Response**: Have procedures for PII data breaches
7. **Compliance Monitoring**: Regular compliance monitoring and updates

## Configuration

### Environment Variables
- `PORT_BEN`: Service port
- `REDIS_HOST`: Redis host for microservice communication
- `REDIS_PORT`: Redis port
- `REDIS_PASSWORD`: Redis password
- `RABBIT_MQ_URL`: RabbitMQ connection URL
- `SMTP_*`: Email configuration for notifications

### Dependencies
- **@rahataid/sdk**: Core SDK with job definitions and constants
- **@rumsan/prisma**: Database ORM
- **@rumsan/extensions**: Extension utilities
- **@rahat/stats**: Statistics module
- **Bull**: Queue processing
- **EventEmitter**: Event handling

## Security Features

1. **PII Separation**: Sensitive data is stored separately
2. **Data Sanitization**: Input data is sanitized before processing
3. **Wallet Validation**: Cryptographic wallet validation
4. **Signature Verification**: Digital signature verification
5. **Access Control**: Role-based access control through guards

## Error Handling

- **RpcExceptionFilter**: Global exception filter for microservice errors
- **Retry Mechanisms**: Configurable retry attempts for failed operations
- **Validation**: Comprehensive input validation
- **Logging**: Structured logging for debugging and monitoring

## Performance Optimizations

1. **Batch Processing**: Large operations are processed in batches
2. **Queue Management**: Background processing for heavy operations
3. **Database Optimization**: Efficient queries with proper indexing
4. **Caching**: Redis-based caching for frequently accessed data

## Integration Points

- **Wallet Service**: For wallet address validation and management
- **Project Service**: For project-related operations
- **Statistics Service**: For analytics and reporting
- **Email Service**: For notifications and communications
- **Community Tools**: For beneficiary import/export operations

This microservice provides a comprehensive solution for beneficiary management with robust CRUD operations, security features, and scalability considerations.
