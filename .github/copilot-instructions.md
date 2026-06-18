# Rahat Platform AI Coding Instructions

## Architecture Overview
Rahat is a blockchain-based aid distribution platform built as an Nx monorepo with NestJS applications. It supports multi-tenant projects for aid distribution via smart contracts and off-chain services.

- **Apps**: 
  - `rahat`: Main NestJS API server handling projects, users, vendors, beneficiaries, and blockchain interactions.
  - `beneficiary`: NestJS app for beneficiary-facing operations.
  - `contracts`: Hardhat-based smart contracts for Ethereum-compatible blockchains.
  - `graph`: The Graph subgraph for indexing blockchain events.

- **Libs**:
  - `sdk`: Shared TypeScript utilities, DTOs, and types (e.g., `libs/sdk/src/project/` for project models).
  - `stats`: Statistics and analytics services.
  - `wallet`: Wallet management and blockchain interactions.
  - `subgraph`: GraphQL schema definitions.
  - `contracts`: Contract ABIs and utilities.

- **Database**: PostgreSQL with Prisma ORM. Schema in `prisma/schema.prisma` includes multi-tenant models like `Project`, `Beneficiary`, `Vendor`, with auth via roles/permissions.

- **Integrations**: RabbitMQ for queues, Stellar SDK for payments, SMTP for emails, Redis for microservices.

- **Key Patterns**: Request context for tenant isolation, CASL for permissions, Winston for logging, class-validator for DTOs.

## Critical Workflows
- **Local Setup**: Run `pnpm bootstrap` to initialize Docker containers, DB, and seeds.
- **Serve Apps**: `pnpm rahat` or `pnpm beneficiary` starts NestJS servers with hot reload.
- **Database**: `pnpm prisma:studio` for DB viewer; `pnpm migrate:dev` for schema changes; `pnpm seed:*` scripts populate project-specific data (e.g., `seed:eldevsettings` for EL project).
- **Contracts**: `cd libs/contracts && pnpm contracts:compile` to compile Solidity; `cd apps/graph && pnpm graph:codegen` to generate subgraph types.
- **Testing**: `pnpm test` runs Jest suites; `pnpm bruno:test` executes API tests via Bruno.
- **Build/Deploy**: `pnpm build:all` for parallel Nx builds; Dockerfiles in root for containerization; `docs/deployments.md` for production setup including contract deployment.

## Project-Specific Conventions
- **Nx Generators**: Use `nx g @nx/nest:resource --directory=apps/$app/src --crud=true` for new REST endpoints with auto-generated CRUD.
- **Environment Config**: `.env` files with project-specific settings; seed scripts update DB configs dynamically.
- **Multi-Tenancy**: All entities scoped by `projectId`; use `RequestContextService` (in `apps/rahat/src/request-context/`) to access current project.
- **Auth & Permissions**: JWT-based auth with CASL abilities; roles defined in DB, checked via `@CheckPermissions()` decorator.
- **File Handling**: Use `UploadService` in `apps/rahat/src/upload/` for file uploads with validation.
- **Blockchain Calls**: Via `WalletService` in `libs/wallet/`, using ethers.js for contract interactions.
- **Queue Jobs**: Bull queues for async tasks like notifications; processors in `apps/rahat/src/processors/`.
- **Logging**: Custom Winston logger configured in `apps/rahat/src/logger/`, with structured logs for debugging.

## Examples
- **Adding a New API Endpoint**: Create controller in `apps/rahat/src/projects/projects.controller.ts`, DTO in `libs/sdk/src/project/`, service in `projects.service.ts`. Example: `POST /projects` uses `CreateProjectDto` with validation.
- **Database Query**: Inject Prisma in services: `constructor(private prisma: PrismaService) {}`; query: `await this.prisma.beneficiary.findMany({ where: { projectId } })`.
- **Contract Deployment**: Scripts in `tools/scripts/production-setup/` update DB with deployed addresses from `deployments/contracts.json`.
- **Testing**: Unit tests in `*.spec.ts` use Jest; e2e in `apps/*-e2e/`; mock Prisma with test DB.

Reference: `prisma/schema.prisma` for data models, `nx.json` for build dependencies, `apps/rahat/src/main.ts` for app bootstrap, `docs/deployments.md` for production workflows.