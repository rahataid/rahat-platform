# Stress Testing Module

## Overview

The Stress Testing Module is designed using the **Open-Close Principle** to provide a robust, modular, and extensible framework for stress testing various components of the Rahat platform. The architecture allows for easy addition of new stress test types without modifying existing code.

## Architecture

### Core Components

1. **IStressTestStrategy Interface** - Defines the contract for all stress test strategies
2. **BaseStressTestStrategy** - Abstract base class providing common functionality
3. **StressTestStrategyFactory** - Factory pattern implementation for creating appropriate strategies
4. **StressTestingService** - Main service orchestrating stress test execution
5. **StressTestingController** - REST API endpoints for stress testing

### Design Patterns Used

- **Strategy Pattern** - Different stress test implementations
- **Factory Pattern** - Creating appropriate strategy instances
- **Open-Close Principle** - Open for extension, closed for modification
- **Single Responsibility Principle** - Each strategy handles one type of test

## Available Strategies

### 1. Beneficiary Import Strategy
- **Type**: `BENEFICIARY_IMPORT`
- **Purpose**: Stress tests beneficiary import functionality from Community Tool
- **Parameters**:
  ```typescript
  {
    numberOfBeneficiaries: number;
    groupName?: string;
    batchSize?: number;
    enableValidation?: boolean;
    generateBankDetails?: boolean;
  }
  ```

## API Endpoints

### Execute Stress Test
```http
POST /stress-test/execute
Content-Type: application/json

{
  "testType": "beneficiary_import",
  "parameters": {
    "numberOfBeneficiaries": 100,
    "groupName": "test-group",
    "batchSize": 10,
    "enableValidation": true,
    "generateBankDetails": true
  }
}
```

### Get Available Strategies
```http
GET /stress-test/strategies
```

### Validate Configuration
```http
POST /stress-test/validate
Content-Type: application/json

{
  "testType": "beneficiary_import",
  "parameters": {
    "numberOfBeneficiaries": 100
  }
}
```

### Beneficiary Import (Typed Endpoint)
```http
POST /stress-test/beneficiary-import
Content-Type: application/json

{
  "numberOfBeneficiaries": 1000,
  "groupName": "stress-test-group",
  "batchSize": 50,
  "enableValidation": true,
  "generateBankDetails": false
}
```

## How to Add a New Stress Test Strategy

### Step 1: Define Your Strategy Interface (Optional)
```typescript
interface YourTestConfig {
  // Define your specific parameters
  parameter1: string;
  parameter2: number;
  // ... other parameters
}
```

### Step 2: Create Your Strategy Class
```typescript
import { Injectable } from '@nestjs/common';
import { BaseStressTestStrategy } from './base-stress-test.strategy';
import { StressTestType, StressTestExecutionConfig, StressTestExecutionResult } from '../types/stress-test.interface';

@Injectable()
export class YourTestStrategy extends BaseStressTestStrategy {
  
  getName(): string {
    return 'Your Test Strategy';
  }

  getDescription(): string {
    return 'Description of what your strategy does';
  }

  getSupportedTestType(): StressTestType {
    return StressTestType.YOUR_TEST_TYPE; 
  }

  protected validateSpecificConfig(config: StressTestExecutionConfig): boolean {
    const params = config.parameters as YourTestConfig;
    return true;
  }

  async execute(config: StressTestExecutionConfig): Promise<StressTestExecutionResult> {
    this.logExecution(config);
    
    try {
      const params = config.parameters as YourTestConfig;
      
      return this.createSuccessResult('Success message', data, metrics);
    } catch (error) {
      this.logError(error);
      return this.createErrorResult('Error message', [error.message]);
    }
  }
}
```

### Step 3: Add Your Test Type to the Enum
```typescript
// In types/stress-test.interface.ts
export enum StressTestType {
    BENEFICIARY_IMPORT = 'beneficiary_import',
    VENDOR_MANAGEMENT = 'vendor_management',
    YOUR_TEST_TYPE = 'your_test_type', // Add this line
    // ... other types
}
```

### Step 4: Register Your Strategy
```typescript
// In factories/stress-test-strategy.factory.ts
private registerStrategies(): void {
    this.strategies.set(StressTestType.BENEFICIARY_IMPORT, BeneficiaryImportStrategy);
    this.strategies.set(StressTestType.YOUR_TEST_TYPE, YourTestStrategy); // Add this line
    // ... other strategies
}
```

### Step 5: Add Provider to Module
```typescript
// In stress-testing.module.ts
providers: [
    StressTestingService,
    StressTestStrategyFactory,
    BeneficiaryImportStrategy,
    YourTestStrategy, // Add this line
    // ... other strategies
],
```

## Usage Examples

### Basic Beneficiary Import
```typescript
const config: StressTestExecutionConfig = {
  testType: StressTestType.BENEFICIARY_IMPORT,
  parameters: {
    numberOfBeneficiaries: 50,
    groupName: 'my-test-group'
  }
};

const result = await stressTestingService.executeStressTest(config);
```

### Advanced Configuration with Metadata
```typescript
const config: StressTestExecutionConfig = {
  testType: StressTestType.BENEFICIARY_IMPORT,
  parameters: {
    numberOfBeneficiaries: 1000,
    groupName: 'large-test',
    batchSize: 100,
    enableValidation: true,
    generateBankDetails: false
  },
  metadata: {
    description: 'Large scale import test',
    environment: 'staging',
    requestedBy: 'user@example.com'
  }
};
```

## Best Practices

1. **Always validate configurations** - Use the `validateSpecificConfig` method
2. **Log appropriately** - Use the built-in logging methods from base class
3. **Handle errors gracefully** - Return proper error results instead of throwing
4. **Use meaningful metrics** - Provide execution time and other relevant metrics
5. **Keep strategies focused** - Each strategy should handle one specific type of test
6. **Use dependency injection** - Inject required services through constructor

## Testing

### Unit Testing Your Strategy
```typescript
describe('YourTestStrategy', () => {
  let strategy: YourTestStrategy;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourTestStrategy],
    }).compile();
    
    strategy = module.get<YourTestStrategy>(YourTestStrategy);
  });

  it('should validate correct configuration', () => {
    const config = {
      testType: StressTestType.YOUR_TEST_TYPE,
      parameters: { /* valid parameters */ }
    };
    
    expect(strategy.validateConfig(config)).toBe(true);
  });
  
  // Add more tests...
});
```

## Migration Guide

### From Legacy API
The legacy `executeBenfImport` method is still supported but deprecated. To migrate:

**Old:**
```typescript
await stressTestingService.executeBenfImport({
  numberOfBeneficiaries: 100,
  groupName: 'test'
});
```

**New:**
```typescript
await stressTestingService.executeStressTest({
  testType: StressTestType.BENEFICIARY_IMPORT,
  parameters: {
    numberOfBeneficiaries: 100,
    groupName: 'test'
  }
});
```
