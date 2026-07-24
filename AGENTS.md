# RAHAT PLATFORM KNOWLEDGE BASE

## OVERVIEW
NestJS backend core for Rahat humanitarian aid platform. Nx monorepo with 2 main apps (rahat API server, beneficiary microservice) + 6 shared libs. Prisma ORM, Bull queues, Redis microservice transport, EVM+Stellar blockchain.

## STRUCTURE
```
rahat-platform/
├── apps/
│   ├── beneficiary/ # Beneficiary microservice
│   ├── contracts/   # Solidity smart contracts (Hardhat)
│   ├── graph/       # TheGraph subgraph
│   └── rahat/       # Main API server (REST + Redis microservice)
├── libs/            # Shared logic: contracts, extensions, sdk, stats, subgraph, wallet
└── prisma/          # Schema + 30 country-specific seed scripts
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| New feature module | `apps/rahat/src/{feature}/` |
| New API endpoint | `apps/rahat/src/{feature}/{feature}.controller.ts` |
| New DTO | `libs/extensions/src/dtos/` |
| New SDK type | `libs/sdk/src/` |
| DB migration | `prisma/migrations/` |
| Smart contract | `libs/contracts/contracts/` |
| Queue processor | `apps/rahat/src/processors/` |
| Event listener | `apps/rahat/src/listeners/` |
| Project action | `apps/rahat/src/projects/actions/` |
| Wallet operation | `libs/wallet/src/` |
| Seeding | `prisma/seed.*.ts` |

## CONVENTIONS (platform-specific, see root AGENTS.md for globals)
- TSConfig: `strictPropertyInitialization: false`, `experimentalDecorators: true`
- Path aliases: `@rahataid/extensions`, `@rahataid/sdk`, `@rahataid/contracts`, `@rahataid/wallet`, `@rahataid/subgraph`, `@rahat/stats`
- pnpm for package management (unlike npm in other workspaces)

## ANTI-PATTERNS (platform-specific, see root AGENTS.md for globals)
- DO NOT use service locator pattern (`ModuleRef.get`)
- Avoid multi-chain support refactoring debt (see TODOs in wallet/)

## NOTES
- Beneficiary import supports Excel and JSON parsers (see `beneficiary/parser/`)
- Project actions: per-type handlers in `projects/actions/` (AA, CVA, C2C, EL, RP, Cambodia)
- License: MPL-2.0
