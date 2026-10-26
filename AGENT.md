# rahat-platform (core)

This is **core** — the main Rahat backend. It's what project-specific microservices (anticipatory action: [rahat-project-aa](https://github.com/rahataid/rahat-project-aa), and others — EL, CVA, Cambodia, C2C, RP, AidLink) connect to, and what the frontend ([rahat-ui](https://github.com/rahataid/rahat-ui)) talks to directly over HTTP. Core does not contain project-specific business logic itself (beyond what's generic across all project types) — it authenticates, routes, and dispatches "actions" to the right project microservice over Redis. See [docs/agent/action-dispatch.md](./docs/agent/action-dispatch.md) for exactly how that works — this is the mechanism every project repo's own docs point back to.

Stack: NestJS, Prisma/PostgreSQL, Redis, BullMQ, Nx monorepo. Serves both HTTP (REST, Swagger at `/swagger`) and a Redis microservice transport simultaneously from the same process (`apps/rahat`).

**New to this repo?** This file → [coding-patterns.md](./docs/agent/coding-patterns.md) → [action-dispatch.md](./docs/agent/action-dispatch.md) (the thing every other repo in this ecosystem depends on) → whichever other doc matches your area.

## Before any larger feature change

Run the `grill-with-docs` skill first for anything beyond a small/mechanical change — same convention as rahat-project-aa. Skill files are checked into `.claude/skills/` / `.agent/skills/` in this repo.

## Database / Prisma

- Schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`.
- **Before any schema change**: pull latest `origin/dev` (or this repo's default branch) first — same stale-migration-overlap risk as every other repo here.
- Seed scripts: `prisma/seed.*.ts`, heavily per-project — `seed.add-aadatasource.ts`, `seed.cambodiadevsettings.ts`, `seed.eldevsettings.ts`, etc. One seed per project-type's dev settings/datasource, not shared.

## Repo structure

```
apps/
  rahat/            # the core app itself — HTTP API + microservice, see module map below
  rahat-e2e/
  beneficiary/       # separate beneficiary microservice (its own app, not a module of rahat)
  beneficiary-e2e/
  shared-auth/        # separate auth microservice
  shared-auth-e2e/
  contracts/          # core-level EVM Solidity contracts (Hardhat) — base Rahat contracts
  graph/               # subgraph/indexer app
libs/
  sdk/        # @rahataid/sdk — shared constants/types/clients, published to npm, consumed
              # externally by every project repo (incl. rahat-project-aa). Source of truth
              # for cmd strings (AAJobs, etc) and MS_ACTIONS keys. Change here, not per-repo.
  contracts/  # @rahataid/contracts — base Solidity libraries (AbstractOwner, etc) other
              # repos' contracts import (e.g. rahat-project-aa's RahatToken.sol)
  extensions/ # @rahataid/extensions — shared Nest exception filters, interceptors, DTOs
  stats/      # @rahat/stats — stats entities/DTOs
  subgraph/   # @rahataid/subgraph
  wallet/     # @rahataid/wallet — EVM + Stellar wallet/custody helpers
```

### `apps/rahat/src` — module map

| Folder | Purpose |
|---|---|
| `app/` | root module, `auth-client.module.ts` (global `AUTH_SERVICE_CLIENT` → shared-auth), app-level jobs/constants |
| `beneficiary/` | core-side beneficiary records (note: AA keeps its own beneficiary data and prefers reading its own DB over calling this — don't assume AA always round-trips here for beneficiary reads) |
| `comms/` | outbound comms coordination |
| `configs/` | config services (e.g. `cors.config.ts`) |
| `constants/` | core constants |
| `cron/` | scheduled jobs |
| `decorators/` | custom decorators/guards (e.g. `ClosedProjectGuard`) |
| `events/` | event definitions |
| `grievance/` | receives `rahat.jobs.grievance.created` etc from project microservices (e.g. AA — see rahat-project-aa's `stakeholders-and-grievances.md`) |
| `health/` | health checks |
| `imports/` | bulk import handling |
| `listeners/` | event listener wiring |
| `logger/` | Winston logger setup |
| `notification/` | notification dispatch |
| `offramp/` | core-level offramp coordination (separate from, and coarser than, each project's own offramp — e.g. AA's `payouts/offramp.service.ts`) |
| `otp/` | core-level OTP (separate instance from each project's own OTP service) |
| `processors/` | BullMQ processors |
| `projects/` | **the action-dispatch hub** — `project.controller.ts`/`project.service.ts` + `actions/` (one file per project type: `aa.action.ts`, `cva.action.ts`, `el.action.ts`, `cambodia.action.ts`, `c2c.action.ts`, `rp.action.ts`, `aidlink.action.ts`, `comms.action.ts`, `ms.trigger.action.ts`, `common.action.ts`). See action-dispatch.md. |
| `queue/` | queue service |
| `request-context/` | request-scoped context |
| `token/` | token-related endpoints |
| `upload/` | file upload + parsing (feeds into `handleProjectActions` for bulk-import actions) |
| `users/` | user management |
| `utils/` | shared utilities (`doc-parser.ts` for upload parsing, etc) |
| `vendors/` | core-side vendor records |
| `wallet/` | wallet endpoints |

### Other apps

- `apps/beneficiary/src` — standalone beneficiary microservice: `beneficiary/`, `consumers/`, `processors/`, `listeners/`, `exceptions/`, `utils/`.
- `apps/shared-auth/src` — standalone auth microservice: `ability/`, `app/`.
- `apps/contracts/` — Hardhat project, base Rahat Solidity contracts (published as `@rahataid/contracts` via `libs/contracts`, which other repos' contracts import from).
- `apps/graph/` — subgraph/indexer, same naming convention as rahat-project-aa's `apps/graph`.

## Coding patterns to follow

Mirror what's already here — see [coding-patterns.md](./docs/agent/coding-patterns.md) for the full writeup with canonical file references. Summary:

- **Hybrid transport**: `apps/rahat` is both an HTTP REST API (`@Controller`, Swagger-documented) and a Redis microservice (`app.connectMicroservice`) from one process. New core-facing endpoints are usually HTTP; new project-microservice-facing endpoints are `@MessagePattern`.
- **Guards + abilities**: HTTP controllers use `@UseGuards(JwtGuard/HybridJwtGuard, AbilitiesGuard)` + `@CheckAbilities({actions, subject})` from `@rumsan/user`, not ad-hoc auth checks.
- **Action-dispatch extension point**: a new action for an existing project type goes in that project's `actions/*.action.ts` file as `{ [MS_ACTIONS.X.Y]: (uuid, payload, sendCommand) => sendCommand({cmd: AAJobs.X.Y, uuid}, payload) }`, registered in `handleProjectActions`'s `actions` map — see action-dispatch.md. Don't hand-roll a one-off dispatch path elsewhere.
- **Shared cmd strings live in `libs/sdk`**, not duplicated by hand in the consuming project repo. If a project repo's cmd constant doesn't match `libs/sdk`'s, that's a bug, not a style choice — see action-dispatch.md's worked example of exactly this happening.

## Docs (`docs/agent/`)

| Doc | Covers |
|---|---|
| [coding-patterns.md](./docs/agent/coding-patterns.md) | Architecture intent + canonical examples |
| [action-dispatch.md](./docs/agent/action-dispatch.md) | How core dispatches to project microservices — with a confirmed real gap worked through |

## Keeping docs in sync

Same convention as rahat-project-aa: update the relevant `docs/agent/*.md` whenever the implementation it describes changes, and bump a `_Last updated: YYYY-MM-DD_` line at the bottom for any functional change (skip for typo/formatting-only edits).
