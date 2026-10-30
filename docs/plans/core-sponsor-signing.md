# Plan: Core Sponsor signing

Decisions: `docs/adr/0001-core-sponsor-signs-on-platform.md`. Terms: `CONTEXT.md`.

Branch `734-core-sponsor-signing` in both repos: `rahat-platform` off `734-fetch-update`, `rahat-project-aa` off `dev`. AA line references below are against `dev`.

## Flow

```
project AA                                   rahat-platform
----------                                   --------------
fetch beneficiary secrets (existing RPC)
build unsigned tx:
  source = Project Sponsor
  beginSponsoring(source=Core) / createAccount(0) / endSponsoring(source=beneficiary)
  / changeTrust(source=beneficiary) / endSponsoring
sign with Project Sponsor + beneficiaries
send XDR + projectUuid  ------------------>  validate, check core free XLM (serial)
                                             add Core signature
submit  <------------------ signed XDR ----
```

Close-out does not use this path. Its ops are sourced from the beneficiary, so the Project Sponsor (tx source) and the beneficiaries sign, and accounts merge into the Core Sponsor.

## Phase 1: platform (`rahat-platform`)

1. **Setting.** `STELLAR_CORE_SPONSOR_SETTINGS` = `{ network, horizonUrl?, sponsorSecret, sponsorPublicKey }`, stored with `isPrivate: true`. `@rumsan/extensions/settings` already masks private values on list and refuses them in `getPublic`, so no sanitizer is needed. The service reads it with `prisma.setting.findUnique` (same as `getSiteInfo` in `app.service.ts`). Add a seed script modelled on `rahat-project-aa/prisma/seed-stellar-sponsor-settings.ts`.
2. **Job names.** Add to `libs/sdk` (next to `libs/sdk/src/wallet/wallets.jobs.ts`):
   - `rahat.jobs.stellar.getCoreSponsorStatus` -> `null` if unconfigured, else `{ publicKey, freeStroops }`.
   - `rahat.jobs.stellar.signSponsorshipTx` -> payload `{ projectUuid, xdr }`, returns `{ xdr }`.
3. **Module.** `apps/rahat/src/stellar-sponsor/` with controller (`@MessagePattern`, same shape as `wallet.controller.ts`) and service.
4. **Validator.** One pure function `validateSponsorshipTx(tx, ctx)`, no I/O, so it unit-tests directly. Rules:
   - allowed ops only: `beginSponsoringFutureReserves`, `createAccount` (`startingBalance` 0), `changeTrust` (limit not 0, so it adds a trustline), `endSponsoringFutureReserves`;
   - every begin has a matching end for the same account;
   - tx source is not the Core Sponsor; Core is the source of no op except `beginSponsoringFutureReserves`;
   - at most 16 sponsored accounts (mirror `MAX_ACCOUNTS_PER_BATCH`);
   - every `sponsoredId` is in the allowed-wallet set passed in (step 5).
5. **Membership lookup.** Wallets must belong to a beneficiary with a `BeneficiaryProject` row for `projectUuid`. Include soft-deleted rows (`deletedAt` set) so late unassignment does not block sponsorship. The address the project holds is the chain-specific `WalletAddress.address` when one exists, else `Beneficiary.walletAddress` (see `getGroupSyncData` in `apps/beneficiary/src/beneficiary/beneficiary.service.ts`), so resolve wallet to beneficiary through both. `BeneficiaryProject` rows are written in the assign transaction before the group sync reaches the project, so they exist by the time sponsorship runs.
6. **Funds check, serialized.** Read core account from Horizon, compute free = balance - minBalance (counting `numSponsoring` and `numSponsored`), refuse with `INSUFFICIENT_SPONSOR_FUNDS` if below 1.6 XLM x accounts needing a reserve. Run the check and signing under one in-process mutex so concurrent requests do not both pass. Port `sponsorFreeStroops` / `sponsorRequiredStroops` from `rahat-project-aa/libs/stellar/src/utils/sponsor.ts`: `@rahataid/stellar` is a path alias inside the AA monorepo, not a published package. Platform already depends on `@stellar/stellar-sdk` 15.1.0.
7. **Signing.** `tx.sign(coreKeypair)` on the parsed tx, return base64 XDR. Never log the secret or the full XDR.

## Phase 2: project AA (`rahat-project-aa`)

1. **`libs/stellar` batch create.** Add an optional `reservePayer` to the op context: `{ publicKey: string; sign(tx): Promise<Transaction> }`. In `createSponsoredAccountsBatch` (`libs/stellar/src/operations/account.ts:132`):
   - `beginSponsoringFutureReserves` gets `source: reservePayer.publicKey` when set;
   - keep `tx.sign(sponsorKeypair)` and beneficiary signatures;
   - call `reservePayer.sign` before submit.
   Absent `reservePayer` = today's behavior (the fallback).
2. **Processor wiring.** In `stellar-sponsor.processor.ts`, before `sponsorAccountsBatch`, call `getCoreSponsorStatus` over `CORE_MODULE`. If non-null, build `reservePayer` that calls `signSponsorshipTx` with `process.env.PROJECT_ID`. If null, no `reservePayer`.
3. **Merge destination.** In `mergeSponsoredAccountsBatch` (`account.ts:283`), destination = core public key when configured, else the Project Sponsor. No platform signing.
4. **Assign-time check.** `assertSponsorFundsForGroup` (`stellar-sponsor.service.ts:76`): when core is configured, take free XLM from `getCoreSponsorStatus` instead of `getSponsorAccountInfo()`. Keep the in-project queue and pending demand count. Same `INSUFFICIENT_SPONSOR_FUNDS` error shape; `sponsorWallet` param becomes core's public key.
5. **Failure path.** A sign-time `INSUFFICIENT_SPONSOR_FUNDS` goes through the existing `markBeneficiariesFailed` + rethrow, so `RETRY_SPONSORSHIP_FOR_GROUP` re-queues after a top-up. Confirm the retry handler does not treat this error as terminal.
6. **Project Sponsor.** Keep `STELLAR_SPONSOR_SETTINGS` and its trustline/XLM-funding behavior. Only fee payment changes under the core flow (see risks).

## Phase 3: tests

- Platform: validator spec covering each refusal (extra op type, nonzero `startingBalance`, core as tx source, core-sourced payment, unpaired begin, 17 accounts, wallet not assigned to project, soft-deleted assignment accepted) plus a happy path. Service spec for the funds refusal and the mutex.
- Project AA: update `account.spec.ts` for `reservePayer` set and unset; processor spec for the fallback and for a signing refusal.
- Testnet run: one group assigned in two projects, core funded for one group only. Expect one batch to succeed and the other to fail then succeed after top-up and retry.

## Order

1. Platform validator + spec (pure, no dependencies).
2. Platform setting, jobs, controller, funds check, signing.
3. `libs/stellar` `reservePayer` + spec.
4. Processor wiring, merge destination, assign-time check.
5. Testnet run.

## Risks to check during build

- **Asset not pinned.** Platform does not know each project's asset, so `changeTrust` accepts any non-native asset. Bounded by the beneficiary-membership rule; pin per asset only if platform ever stores project assets.
- **Caller identity is trusted.** `projectUuid` comes from the message payload, as with the existing wallet-secret RPC. A project that lies about its uuid can only name beneficiaries of another project it can already reach by wallet address. Revisit if the transport gets authentication.
- **Fee payer.** Under the core flow the Project Sponsor pays all fees, so its XLM balance now gates sponsorship. Add a clear error when it cannot cover fees.
- **Timeout.** The tx uses `setTimeout(100)` (`account.ts`); the platform round trip must fit inside it, with a rebuild on `tx_too_late`.
- **Mutex is per process.** Not a concern: production runs a single platform instance, so in-process serialization covers every project. A Redis lock is only needed if platform is ever scaled out.
- **SDK versions differ.** AA builds with `@stellar/stellar-sdk` ^13, platform parses with 15.1.0. XDR is wire-stable, but cover a round trip in the testnet run.

## Build notes (2026-10-30)

Phases 1 and 2 are implemented. Testnet run on 2026-10-30: tx `f388e7f2d9c0eb7294c79e15187f1423832a9fba6d95727bfd2c8704c0848a3d` sponsored one beneficiary with the project sponsor as source, both `beginSponsoringFutureReserves` sourced from the core, and 3 signatures. The two-project, underfunded-core scenario is still to run.

Changes from the plan made during the build:

- **Pending reserve.** Serial signing alone does not stop the race: the project submits after platform signs, so the next sign can read Horizon before the previous tx lands. Platform keeps the reserve of each signed tx as pending until the tx's `maxTime`, and refuses txs that expire more than 300 s out. A landed tx counts twice until expiry, which errs on the safe side.
- **Exact reserve.** Platform counts 2 base reserves per `createAccount` and 1 per `changeTrust` instead of a flat 1.6 XLM per beneficiary; the project sponsor pays fees, so core needs no headroom.
- **Network guard.** `getCoreSponsorStatus` returns `networkPassphrase`; the project refuses to sponsor when it differs from its own.
- **No silent fallback on RPC failure.** Fallback to the project sponsor happens only when platform says no core is configured. A failed status call fails the batch, so reserves never land on the project sponsor while a core exists. Deploy platform before project AA.
- **Hash check.** The project verifies the tx platform returns has the same hash as the one it sent.
- Jobs live under `WalletJobs` (`rahat.jobs.wallet.getCoreSponsorStatus`, `rahat.jobs.wallet.signSponsorshipTx`); the controller and service are registered in `WalletModule`.
