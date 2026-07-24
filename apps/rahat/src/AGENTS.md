# RAHAT API KNOWLEDGE BASE

## OVERVIEW
Main Rahat API server — NestJS app with REST endpoints + Redis microservice. 17 feature modules.

## STRUCTURE
- beneficiary/ — CRUD, wallet processing, Excel/JSON parsers, wallet interceptor
- comms/ — Communication service (forRoot pattern)
- configs/ — CORS config
- decorators/ — ExternalAppGuard, headers decorator
- grievance/ — Complaint management
- listeners/ — Event listeners (email, SMS, meta transactions). No sharing.
- logger/ — Winston logger config
- notification/ — Push/notification management
- offramp/ — Fiat offramp (KotaniPay provider)
- otp/ — OTP generation, SMS providers (Prabhu)
- processors/ — Bull queue processors (project, rahat, meta-transaction)
- projects/ — Project management + actions/ per-type handlers
- queue/ — Queue management controller/service
- request-context/ — Request context module/service
- token/ — Token management
- upload/ — File upload handling
- users/ — User management (extends @rumsan/user)
- utils/ — Utility functions (15 files)
- vendors/ — Vendor management, handleMicroServiceCall utility
- wallet/ — Wallet CRUD, xcapit, provider registry, FS storage

## WHERE TO LOOK
| Task | Location |
| :--- | :--- |
| New feature | Create {name}/ directory; import in app.module.ts |
| New project type | Add action file in projects/actions/{type}.action.ts |
| New queue processor | Add in processors/; register in app.module.ts |
| New event listener | Add in listeners/; use @OnEvent decorator |
| New SMS provider | Add in otp/sms/ |
| New offramp provider | Add in offramp/offrampProviders/ |
| Custom decorator | Add in decorators/ |
| Beneficiary import | parsers in beneficiary/parser/ |

## CONVENTIONS
- AppModule imports all feature modules — no lazy-loading
- Microservice calls via `handleMicroServiceCall` utility in vendors/
- Project actions return handlers for type-specific operations (dispatch pattern)
- Wallet uses blockchain provider registry for multi-chain support
- CommsModule uses `.forRoot()` pattern
- RSUserModule bundles Auths, Users, Roles, Signup modules

## NOTES
- main.ts bootstraps both HTTP server and Redis microservice in same process
- app.module.ts uses ExternalAppGuard as global APP_GUARD
- PrismaService provided at app module level (shared across all feature modules)
