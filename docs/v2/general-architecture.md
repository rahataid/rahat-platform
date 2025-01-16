# Rahat Platform: Conceptual Architecture


The platform follows a modular architecture where projects function as independent microservices, with Rahat Core serving as the gateway for all interactions. 

1. **Rahat Core Platform**: Acts as the central gateway and controller for all projects.
2. **Rahat Projects**: Independent microservices accessible only via Rahat Core.
3. **Rahat Platform Services**: The foundational services to be used by all projects.
     - Projects communicate with Rahat Core for shared services.
     - All external requests pass through Rahat Core.

## Core Entities

### 1. **Users**
- **Purpose**: Centralized user management.
- **Key Features**:
  - Authentication and Authorization.
  - Role-based access control

### 2. **Vendors**
- **Purpose**: Facilitate offramping for beneficiaries and support onboarding processes.
- **Key Features**:
  - Vendor registration and management.
  - Support for multiple use cases, including beneficiary onboarding and transaction processing.
  - Integration with third-party offramp solutions.

### 3. **Beneficiaries**
- **Purpose**: Maintain records of individuals receiving aid.
- **Key Features**:
  - Beneficiary registration

### 4. **Projects**
- **Purpose**: Isolated microservices representing individual humanitarian projects.
- **Key Features**:
  - Independent execution and lifecycle.
  - Access to shared services provided by the Rahat platform.

## Rahat Core Platform Services
The Rahat core platform acts as a gateway and provides the following default services to all projects:

### 1. **Authentication (Auth)**
- User login and session management.
- Role and permissions management.

### 2. **Audit Trail**
- Comprehensive tracking of all actions performed within the platform.
- Tamper-proof logs for compliance and transparency.

### 3. **Communications**
- SMS, voice, and IVR integration for communication to beneficiaries and users
- Configurable templates for notifications and updates.

### 4. **Trigger Management**
- Fund release triggers based on offchain data(weather data) , currently targetted for AA project

### 5. **Document Management**
- Storage and retrieval of documents associated with users, vendors, and projects.

### 6. **Queue Service Management**
- Asynchronous task processing to ensure scalability and reliability.
- Support for retry mechanisms and prioritization.

### 7. **Exception Handling**
- Centralized error handling and reporting.
- Tools for debugging and issue resolution.

### 8. **Logging**
- Centralized logging for all platform activities.
- Searchable and filterable logs for operational monitoring.


