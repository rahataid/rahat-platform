# Cash Tracker API Endpoints

This folder contains Bruno API endpoints for testing the Cash Tracker functionality in the AA (Account Abstraction) system.

## Available Endpoints

### 1. Execute Action (`execute-action.bru`)

- **Method**: POST
- **URL**: `{{baseUrl}}/projects/{{uuid}}/actions`
- **Purpose**: Execute various cash tracker actions like create_budget, initiate_transfer, confirm_transfer, approve, allowance, transfer
- **Example**: Create budget from UNICEF Nepal CO to Field Office

### 2. Get Transactions (`get-transactions.bru`)

- **Method**: POST
- **URL**: `{{baseUrl}}/projects/{{uuid}}/actions`
- **Purpose**: Retrieve comprehensive transaction flow history
- **Authentication**: Bearer token required

### 3. Initiate Transfer (`initiate-transfer.bru`)

- **Method**: POST
- **URL**: `{{baseUrl}}/projects/{{uuid}}/actions`
- **Purpose**: Initiate cash transfer between entities
- **Example**: Transfer from UNICEF Nepal Field Office to Municipality

### 4. Confirm Transfer (`confirm-transfer.bru`)

- **Method**: POST
- **URL**: `{{baseUrl}}/projects/{{uuid}}/actions`
- **Purpose**: Confirm and complete cash transfers
- **Example**: Municipality confirming transfer from Field Office

### 5. Get Allowance (`get-allowance.bru`)

- **Method**: POST
- **URL**: `{{baseUrl}}/projects/{{uuid}}/actions`
- **Purpose**: Get approved cash allowances between entities
- **Example**: Check allowance from UNICEF Nepal CO to Field Office

## Supported Actions

1. **create_budget**: UNICEF Nepal CO creates budget for Field Office
2. **initiate_transfer**: UNICEF Nepal CO or Field Office initiates transfer
3. **confirm_transfer**: Any role confirms transfer
4. **approve**: Give cash allowance to another entity
5. **allowance**: Check approved cash allowances
6. **transfer**: Execute cash transfers

## Entity Smart Addresses

- **UNICEF Nepal CO**: `0xE17Fa0F009d2A3EaC3C2994D7933eD759CbCe257`
- **UNICEF Nepal Field Office**: `0xB4b85A39C44667eDEc9F0eB5c328954e328E980B`
- **Municipality**: `0xe5159f997F32D04F9276567bb2ED4CC0CdC9D8E4`

## Authentication

All endpoints require Bearer token authentication. The token should be set in the Bruno environment variables as `{{authToken}}`.

## Project Actions System

The cash tracker functionality is accessed through the project actions system, not direct HTTP endpoints. All requests go through:

```
POST {{baseUrl}}/projects/{{uuid}}/actions
```

With the following structure:

```json
{
  "action": "aa.cash-tracker.executeAction",
  "payload": {
    // Cash tracker specific payload
  }
}
```

## Usage

1. Set up your Bruno environment with the correct `baseUrl`, `authToken`, and `uuid`
2. Use the appropriate endpoint for your testing needs
3. Modify the request body as needed for different scenarios
4. Check the response for transaction status and details

## Error Handling

The API will return appropriate error messages for:

- Invalid smart addresses
- Insufficient balances
- Unauthorized actions
- Network/contract issues
- Invalid action types
