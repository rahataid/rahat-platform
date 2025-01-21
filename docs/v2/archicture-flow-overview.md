# Backend Architecture Overview

## High-Level Design

This backend architecture is designed for a microservices-based system with **NestJS** as the primary backend framework, **Prisma** for ORM, **PostgreSQL** as the database, and various supporting components for scalability, reliability, and security. It divides responsibilities into core services, feature-specific microservices, and supporting utilities. Communication between services uses a combination of synchronous REST/gRPC and asynchronous event messaging. The architecture has been enhanced for better modularity, fault tolerance, and alignment with real-world deployment needs. In this design, creating a new project dynamically spins off a microservice instance based on an existing Docker image for the relevant project type, ensuring scalability and modularity. Communication between the frontend, core, and project microservices is streamlined to ensure security and simplicity.

The platform follows a modular architecture where projects function as independent microservices, with Rahat Core serving as the gateway for all interactions.

---

## Key Components

### 1. **Core System**

The **Core System** provides shared functionality and services that are essential for the entire ecosystem. These are designed to be reusable and scalable.

#### Core Components:

1. **Rahat Core**

   - Acts as the central hub connecting all project-specific services.
   - Manages communication between the frontend and individual project microservices.
   - Handles centralized workflows like authentication, authorization, and common data access.
   - Routes all requests from the frontend through a single endpoint to project-specific microservices using the project UUID stored in the database and environment variables.

2. **Authentication Service (Auth)**

   - Handles user authentication (e.g., OAuth2, JWT, session-based).
   - Role-based access control (RBAC) and permission management.
   - Integrated with Passport.js and supports multiple strategies (local, social, API keys).

3. **User Management Service**

   - Manages user profiles, organization memberships, and account settings.
   - Exposes CRUD APIs for user-related actions.

4. **Audit Trail Service**

   - Logs all critical user/system actions (e.g., "Project Created," "User Updated").
   - Provides APIs for querying logs by entity, user, or action type.

5. **Communication Service (Comms)**

   - Manages notifications (email, SMS, push notifications).
   - Listens for domain events (e.g., project creation) and sends relevant messages.
   - Integrates with SMS, voice, and IVR solutions for beneficiary and user communication.

6. **Logging and Monitoring**

   - Centralized logging using **Winston** or **Pino**.
   - Metrics and monitoring via **Prometheus** and visualization with **Grafana**.

7. **Exception Management Service**

   - Captures and tracks errors using tools like **Sentry**.
   - Provides APIs to query error details and resolutions.

8. **API Gateway**
   - Acts as a unified entry point for external clients.
   - Routes requests to appropriate services using service discovery.
   - Handles rate limiting, request authentication, and cross-origin resource sharing (CORS).

---

### 2. **Core Entities**

#### Users

- Centralized user management with authentication and role-based access control.

#### Vendors

- Facilitates offramping for beneficiaries and supports onboarding processes.
- Integrates with third-party offramp solutions.

#### Beneficiaries

- Maintains records of individuals receiving aid.
- Handles registration and support processes for beneficiaries.

#### Projects

- Each project is an independent microservice with its own lifecycle and execution model.
- Projects access shared services through Rahat Core and leverage a single endpoint for interactions.

---

### 3. **Project Microservices**

Projects are modularized into standalone microservices, each responsible for specific project functionalities. These are designed to work independently but integrate seamlessly with the core system.

#### Features:

1. **Dynamic Project Creation**

   - When a new project is created, a dedicated microservice is spun up using a pre-configured Docker image.
   - Each microservice instance is isolated and runs independently to reduce the impact of failures in other projects.

2. **Project Lifecycle Management**

   - Create, update, and delete projects.
   - Manage project statuses and milestones.

3. **Entity Associations**

   - Associate projects with users, vendors, and other entities.

4. **Communication with Core**

   - All communication between the frontend and projects is routed through the core system.
   - The core system identifies the relevant project microservice using the project UUID stored in the database and environment variables.

5. **Business Logic**

   - Validate project data (e.g., budgets, timelines) before storing.
   - Implement domain-specific rules (e.g., role validation for project creation).

6. **Subgraph Integration**

   - Use subgraphs for decentralized data queries via **Graph Protocol**.
   - Each project, such as `Project-RFV` or `Project-C2C`, integrates with a dedicated subgraph to query blockchain data.

7. **Event Publishing**

   - Publishes events (e.g., `ProjectCreatedEvent`) to the event bus for cross-service communication.

8. **Integration Points**
   - Consumes services from Rahat Core, Auth, User Management, and Audit Trail.
   - Notifies the Communication Service when important project events occur.

---

### 4. **Rahat Core Platform Services**

The Rahat core platform acts as a gateway and provides the following default services to all projects:

1. **Authentication (Auth)**

   - User login and session management.
   - Role and permissions management.

2. **Audit Trail**

   - Comprehensive tracking of all actions performed within the platform.
   - Tamper-proof logs for compliance and transparency.

3. **Communications**

   - SMS, voice, and IVR integration for communication to beneficiaries and users.
   - Configurable templates for notifications and updates.

4. **Trigger Management**

   - Fund release triggers based on offchain data (e.g., weather data) currently targeted for the AA project.

5. **Document Management**

   - Storage and retrieval of documents associated with users, vendors, and projects.

6. **Queue Service Management**

   - Asynchronous task processing to ensure scalability and reliability.
   - Support for retry mechanisms and prioritization.

7. **Exception Handling**

   - Centralized error handling and reporting.
   - Tools for debugging and issue resolution.

8. **Logging**
   - Centralized logging for all platform activities.
   - Searchable and filterable logs for operational monitoring.

---

### 5. **Deployment and Configuration**

#### Dynamic Microservice Deployment

- **Dockerized Instances**: Prebuilt Docker images are used for deploying new project-specific microservices.
- **Orchestration**: Kubernetes manages service orchestration and scaling.
- **Environment Variables**: Each microservice instance is configured with its own set of environment variables based on project type (e.g., `Project-RFV`, `Project-AA`).

#### Project Deployment Worker

- Handles the deployment of new project environments.
- Automatically sets up environment variables specific to each project.
- Deploys microservices as containers, orchestrated via Kubernetes or similar tools.

#### Dev Tools

- Includes tools like **Postgres**, **Redis**, **Ganache**, and **pgAdmin** for development and local testing.
- Supports rapid iteration and debugging of project-specific services.

#### Blockchain Integration

- Leverages a blockchain network (e.g., Mumbai) for decentralized data storage and smart contracts.
- Connects to blockchain data via **The Graph Protocol** and supports IPFS for file storage.

---

### 6. **Inter-Service Communication**

1. **Synchronous Communication**

   - Use **gRPC** or **REST** for direct service-to-service communication.
   - Example: The Project Microservice calls the User Management Service to fetch user details.

2. **Asynchronous Communication**
   - Use **BullMQ** for event-driven communication and job processing.
   - Services publish domain events to a queue, and subscribers (workers) process these events asynchronously.
   - Example: When a project is created, the Project Microservice adds a `ProjectCreatedEvent` to a BullMQ queue. The Audit Trail Service listens to this queue and logs the event.

---

### 7. **Supporting Components**

1. **Health and Readiness Probes**

   - Use NestJS's built-in health checks with `@nestjs/terminus`.
   - Implement endpoints like `/health` and `/readiness` to monitor:
     - Database connectivity
     - Dependency service availability
     - Application health (CPU, memory, etc.)

2. **Service Discovery**

   - Use tools like **Consul** or **Eureka** for dynamic service discovery.

3. **Rate Limiting and API Security**

   - Implement rate limiting at the API Gateway level.
   - Secure inter-service communication using mTLS or service meshes like **Istio**.

4. **Database Management**
   - Use **PostgreSQL** for relational data storage, optimized with indexing and partitioning for scalability.
   - Employ **Prisma ORM** for schema and query management, ensuring type safety and developer productivity.
   - Integrate **Redis** as a caching layer for frequently accessed data, such as user roles, project summaries, or session tokens, to improve response times.

#### **Containerization**

- Leverage **Docker** for containerizing each microservice to ensure consistency across environments.
- Use **Kubernetes** for orchestration, managing deployments, scaling, and load balancing.

#### **Monitoring and Observability**

- Set up centralized monitoring using **Prometheus** for metrics collection.
- Use **Grafana** for visualization of metrics and system health dashboards.
- Implement distributed tracing with **OpenTelemetry** or **Jaeger** to track requests across services for performance optimization and debugging.

#### **Testing Frameworks**

- Use **Jest** for unit testing to ensure core functionality is robust.
- Employ **Supertest** for integration testing to validate API endpoints and service interactions.
- Perform end-to-end testing with tools like **Cypress** or Postman to simulate real-world usage scenarios.

---

### 8. **Service Communication Flow Example**

#### **Scenario: A User Creates a Project**

1. **Frontend**:

   - Sends a `POST` request to the **API Gateway** at `/projects`.

2. **API Gateway**:

   - Authenticates the user via the **Auth Service**.
   - Checks the health status of the **Core** and **Project Microservice** via `/health` endpoints.
   - Routes the request to the **Core**.

3. **Core**:

   - Validates the request data and the user's permissions via the **User Management Service**.
   - Identifies the relevant **Project Microservice** using the project UUID stored in the database.
   - Routes the request to the corresponding microservice.

4. **Project Microservice**:

   - Handles the business logic for project creation.
   - Publishes a `ProjectCreatedEvent` to the **BullMQ** queue for asynchronous processing.
   - Responds back to the Core with the project details.

5. **Event Consumers**:

   - **Audit Trail Service**: Logs the event for compliance and operational visibility.
   - **Communication Service**: Sends notifications to stakeholders about the new project creation.

6. **Monitoring and Observability**:

   - Metrics (e.g., request latency, error rates) are sent to **Prometheus**.
   - Distributed tracing spans are created and sent to **Jaeger** or **OpenTelemetry** for debugging and optimization.

7. **Response**:
   - The **Core** aggregates the response and sends it back to the **API Gateway**.
   - The **API Gateway** delivers the final response to the frontend with project details.

---

### 9. **Key Considerations for Scalability and Fault Tolerance**

#### **Fault Tolerance**

- Implement retries with exponential backoff for failed inter-service communication.
- Use circuit breakers (e.g., with **Resilience4j**) to isolate failing services and prevent cascading failures.

#### **Scalability**

- Scale stateless services horizontally using Kubernetes replicas.
- Use read replicas in **PostgreSQL** for read-heavy workloads.
- Optimize **Redis** caching strategies for frequently accessed data.

#### **Security**

- Enforce TLS for all inter-service communication.
- Use mTLS for secure communication between microservices.
- Implement role-based access control (RBAC) for sensitive operations.

#### **Continuous Integration/Continuous Deployment (CI/CD)**

- Automate testing and deployment pipelines with **GitHub Actions**, **GitLab CI**, or **Jenkins**.
- Use blue-green or canary deployments to ensure zero-downtime updates.

#### **Documentation**

- Maintain comprehensive API documentation using **Swagger** or **Postman Collections**.
- Create developer-friendly onboarding guides for new team members.
