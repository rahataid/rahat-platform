# Action dispatch — how core talks to project microservices

This is the mechanism `rahat-project-aa`'s own `AGENT.md` means by "any AA ↔ frontend communication goes through rahat-platform action calls." Traced end to end, with a confirmed concrete gap as a worked example.

## The flow

```
Frontend (rahat-ui)
  → HTTP POST /v1/projects/actions   (project.controller.ts: msActions)
    body: { action: "<MS_ACTIONS key>", payload: {...} }
  → ProjectController.msActions() / upload()
    → ProjectService.handleMsActions() / handleProjectActions({ uuid, action, payload, trigger, user })
      looks up `action` in a flat map merged from every project type's actions/*.action.ts file:
        { ...groupActions, ...beneficiaryGroupActions, ...cambodiaActions, ...projectActions,
          ...elActions, ...aaActions, ...beneficiaryActions, ...vendorActions, ...settingActions,
          ...metaTxActions, ...c2cActions, ...cvaActions, ...rpActions, ...aidLinkActions,
          ...commsActions, ...msTriggerActions, ...notificationActions }
      → actionFunc(uuid, payload, sendCommand)
        → ProjectService.sendCommand(cmd, payload, timeout, client, action, user)
          → client.send(cmd, { ...payload, user }).pipe(timeout(...))
            — a plain @nestjs/microservices ClientProxy.send() over Redis, to whichever
              project microservice owns that cmd's uuid-scoped queue (see rahat-project-aa's
              transport-and-multitenancy.md for the receiving side: @MessagePattern({cmd, uuid: PROJECT_ID}))
```

- `uuid` throughout is the **project's `PROJECT_ID`** (same UUID rahat-project-aa's docs describe) — it's what routes the Redis message to the correct project instance.
- `action` is a human-facing string key (e.g. `MS_ACTIONS.AAPROJECT.TRIGGERS.ADD`) — distinct from `cmd` (e.g. `AAJobs.TRIGGERS.ADD`, which resolves to the literal string `'aa.jobs.triggers.add'`). The action layer exists so the frontend never needs to know the raw cmd string.

## The extension point: one `*.action.ts` file per project type

`apps/rahat/src/projects/actions/` — `aa.action.ts`, `cva.action.ts`, `el.action.ts`, `cambodia.action.ts`, `c2c.action.ts`, `rp.action.ts`, `aidlink.action.ts`, `comms.action.ts`, `ms.trigger.action.ts`, `common.action.ts` (generic/shared), `user-required.action.ts`, `closed-project-allowed.action.ts` (cross-cutting marker files, not per-project).

Each file exports a `ProjectActionFunc` (typed in `@rahataid/sdk`) — a `Record<string, (uuid, payload, sendCommand) => any>`. Adding an action for an existing project type:

```ts
[MS_ACTIONS.AAPROJECT.TRIGGERS.ADD]: (uuid, payload, sendCommand) =>
  sendCommand({ cmd: AAJobs.TRIGGERS.ADD, uuid }, payload),
```

then it's automatically live — `handleProjectActions` spreads every action file's map together, so a new key just needs to exist in the right file, no separate registration step.

**The cmd string (`AAJobs.TRIGGERS.ADD` etc) must already exist in `libs/sdk/src/<project>/` (e.g. `libs/sdk/src/aa/aa.events.ts`'s `JOBS` export, re-exported as `AAJobs`).** This is the single source of truth, published as `@rahataid/sdk` and consumed by the project repo externally. **Do not hand-define a matching cmd string in the project repo without checking it already matches here exactly** — see the worked example below of what happens when it doesn't.

## Worked example of a real, confirmed gap

`aa.action.ts` wires these, all pointing at `AAJobs.TRIGGERS.*` / `AAJobs.RIVER_STATIONS.*` / `AAJobs.WATER_LEVELS.*` (defined in `libs/sdk/src/aa/aa.events.ts`):

| MS_ACTIONS key | cmd (from `libs/sdk`) |
|---|---|
| `AAPROJECT.TRIGGERS.ADD` | `aa.jobs.triggers.add` |
| `AAPROJECT.TRIGGERS.REMOVE` | `aa.jobs.triggers.remove` |
| `AAPROJECT.TRIGGERS.GET_ALL` | `aa.jobs.triggers.getAll` |
| `AAPROJECT.TRIGGERS.GET_ONE` | `aa.jobs.triggers.getOne` |
| `AAPROJECT.TRIGGERS.ACTIVATE` | `aa.jobs.triggers.activate` |
| `AAPROJECT.TRIGGERS.DEV_ONLY` | `aa.jobs.triggers.devOnly` |
| `AAPROJECT.RIVER_STATIONS.GET_DHM` | `aa.jobs.riverStations.getDhm` |
| `AAPROJECT.WATER_LEVELS.GET_DHM` / `GET_GLOFAS` | `aa.jobs.waterLevels.{getDhm,getGlofas}` |

**Checked directly in `rahat-project-aa`: none of these cmd strings exist anywhere in that repo.** `grep -rn "aa.jobs.triggers." apps/aa/src` and equivalent greps for `riverStations`/`waterLevels`/`getDhm`/`getGlofas` all return zero matches. AA's own trigger-related constants (`aa.jobs.contract.addTrigger`, `aa.jobs.evm.addTrigger_<PROJECT_ID>`) use entirely different naming and are themselves unwired to any `@MessagePattern` (see `rahat-project-aa`'s `docs/agent/trigger-pipeline.md`).

This means: calling any of the table above today produces a dispatched Redis message with **no listener**, and will time out (`sendCommand`'s `timeout(timeoutValue)`) rather than erroring immediately. If you're asked to fix "trigger creation doesn't work from the UI," this is why — the fix is on the AA side (implement the `@MessagePattern` handlers matching these exact cmd strings), not here, unless the intent is to deprecate/rename these actions instead.

## Pattern to follow

- Adding a new action for an existing project: add the mapping in that project's `actions/*.action.ts` file, using a cmd string that **already exists** in `libs/sdk/src/<project>/`.
- Adding support for a new project type entirely: new `<project>.action.ts` file, spread it into `handleProjectActions`'s `actions` map in `project.service.ts`.
- Never invent a cmd string in the consuming project repo and expect core to match it by convention — the match has to be literal, and `libs/sdk` is the only place it's safe to define it.
- If you're touching a cmd string in `libs/sdk`, grep the consuming project repo for the old string before renaming — nothing enforces this pairing at build time, as the trigger example above shows.

_Last updated: 2026-10-26_
