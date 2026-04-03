# Rahat Platform Libraries

## OVERVIEW
Shared libraries for rahat-platform apps. Consumed via tsconfig path aliases.

## LIBRARY MAP
| Library | Alias | Purpose | Key Exports |
| :--- | :--- | :--- | :--- |
| contracts/ | @rahataid/contracts | Smart contract ABIs/interfaces | Contract ABIs, type definitions |
| extensions/ | @rahataid/extensions | DTOs for all entities | Beneficiary, vendor, project, grievance, offramp, OTP, notification DTOs; GlobalCustomExceptionFilter, ResponseTransformInterceptor |
| sdk/ | @rahataid/sdk | Core SDK | Modules for AA, app, beneficiary, constants, enums, grievance, offramp, OTP, project, settings, types, utils, vendor, wallet |
| stats/ | @rahat/stats | Statistics | StatsController, StatsModule, StatsService |
| subgraph/ | @rahataid/subgraph | Blockchain subgraph queries | Subgraph query utilities |
| wallet/ | @rahataid/wallet | Multi-chain wallet management | EVM wallet, Stellar wallet, connected wallet utilities |

## CONVENTIONS
- Each lib exports via src/index.ts barrel.
- Sub-path imports supported: @rahataid/sdk/beneficiary, @rahataid/extensions/*.
- DTOs use class-validator + class-transformer decorators.
- Extensions lib provides global exception filter and response interceptor.
- SDK provides enums and constants shared across apps.

## NOTES
- extensions/src/dtos/ has subdirectories per entity (beneficiary/, vendor/, etc.).
- sdk/src/types/ has 14 type definition files.
- wallet/ supports EVM (ethers) and Stellar (stellar-sdk) with connectedWallet abstraction.
- contracts/ integrates with Hardhat for compilation.
- Cross-lib deps: SDK imports from extensions; apps import from all libs.
