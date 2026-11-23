# Coding patterns & architecture intent

Same purpose as rahat-project-aa's doc of the same name: any agent/model touching this repo should produce the same shape of code. Copy the referenced real files, don't improvise a variant.

## 1. Every file carries the MPL license header

```ts
// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
```

Present at the top of essentially every source file in `apps/rahat/src` (see `grievance.controller.ts`, `grievance.module.ts`, `project.service.ts`). New files follow this — check `LICENSE` at repo root before assuming it doesn't apply to a new module.

## 2. One controller can mix HTTP and microservice handlers

Unlike rahat-project-aa (microservice-only), controllers here commonly carry **both** `@Post`/`@Get` (HTTP, Swagger-documented via `@ApiTags`) and `@MessagePattern` (Redis, for other services to call in) in the same class — see `grievance.controller.ts` (HTTP CRUD) vs `project.controller.ts` (has both `@Post('actions')` for the frontend and, deeper in `project.service.ts`, outbound `ClientProxy.send()` calls to project microservices). Don't assume "controller" means one transport here.

## 3. Authorization: `@CheckAbilities` + `@UseGuards`

```ts
@CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
@Post('')
create(@Body() dto: CreateGrievanceDTO, @Request() req: { user: { id: number } }) { ... }
```

`ACTIONS`/`SUBJECTS` from `@rahataid/sdk` (or `@rumsan/user`'s `SUBJECTS`), guards (`JwtGuard`, `HybridJwtGuard`, `AbilitiesGuard`) from `@rumsan/user`. **Note**: some existing controllers have the `@UseGuards`/`@ApiBearerAuth` lines commented out (e.g. `grievance.controller.ts`'s class-level guards) while still carrying `@CheckAbilities` per-handler — that's an existing inconsistency, not a pattern to copy; new controllers should have both the guard and the ability check, not just the latter.

## 4. Shared DTOs/types live in `@rahataid/extensions` or `@rahataid/sdk`, not duplicated per-module

`CreateGrievanceDTO`, `ListGrievanceDTO`, etc. come from `@rahataid/extensions` (`libs/extensions`). A module-local `dto/` folder is for things genuinely specific to that module's internal shape (e.g. `grievance/dto/create-grievance-message.dto.ts`), not a re-declaration of something `@rahataid/extensions` or `@rahataid/sdk` already exports.

## 5. Action dispatch is the integration boundary with project microservices

Full writeup: [action-dispatch.md](./action-dispatch.md). In short: never have a controller/service reach into a project microservice with an ad-hoc `ClientProxy.send()` outside the `projects/actions/*.action.ts` + `handleProjectActions` mechanism — that mechanism exists specifically so the frontend has one endpoint (`POST /v1/projects/actions`) and one dispatch table, instead of one bespoke route per project integration.

## 6. Error shape

`RpcException({ message, code, params })` for microservice-side errors (matches rahat-project-aa's convention exactly — same ecosystem, same shape), `BadRequestException({ message, code })` (Nest HTTP exception) for HTTP-side validation errors close to the controller (see `grievance.controller.ts`'s `USER_ID_REQUIRED` check, `project.controller.ts`'s `MISSING_ACTION_OR_PROJECT_ID`). Pick based on which transport the error surfaces on, not interchangeably.

## 7. `libs/` are the cross-repo contract — treat changes there as breaking by default

`libs/sdk` (`@rahataid/sdk`) and `libs/contracts` (`@rahataid/contracts`) are consumed as published npm packages by other repos in this ecosystem (confirmed: `rahat-project-aa` depends on both externally). A change to a cmd string, exported type, or Solidity library in these two libs can silently break a sibling repo that hasn't bumped its dependency yet — check for consumers before renaming/removing an export, and bump the package version deliberately rather than relying on workspace resolution to paper over a breaking change.

## Related

- [AGENT.md](../../AGENT.md) — repo structure, module map, prisma rules.
- [action-dispatch.md](./action-dispatch.md) — the core ↔ project-microservice mechanism, with a worked real gap.

_Last updated: 2026-10-26_
