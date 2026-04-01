# Walk-In Beneficiary Staging Table — Design Document

**Status**: Draft  
**Author**: AI-assisted  
**Date**: 2026-03-31  
**Scope**: Offline walk-in beneficiary sync only. Online single-add flow is **unchanged**.

---

## 1. Problem Statement

When a vendor comes online and syncs offline walk-in beneficiaries, the current flow immediately triggers the full heavy pipeline:

```
Vendor App → createBulk → Service (dedup + batch) → Bull Queue → Blockchain Tx → DB → Core Sync
```

**Issues with current approach:**

1. **Sync triggers heavyweight pipeline directly** — blockchain calls, DB writes, and core sync all execute in the request's lifecycle (via queue, but vendor waits for enqueue + initial processing).
2. **Vendor gets no instant acknowledgment** — the response depends on queue enqueue success and deduplication against DB.
3. **Retry means re-running everything** — if the pipeline fails mid-way (e.g., blockchain tx fails after 5 retries → DLQ), the vendor must re-sync from the device. The server has no record of what was attempted.
4. **No audit trail** — once data enters the Bull queue, there's no persistent record of the sync request itself. Bull jobs are ephemeral.

## 2. Proposed Solution

Insert a **staging table** between the vendor sync and the existing pipeline. The vendor's sync writes directly to Postgres (fast, reliable), and a **cron worker** picks up staged rows and feeds them into the existing pipeline.

```
Vendor App → syncStaging endpoint → Postgres staging table (instant ACK)
                                          ↓
                              Cron Worker (every 30s)
                                          ↓
                          Existing Pipeline (unchanged)
                          Bull Queue → Blockchain → DB → Core Sync
```

### What Changes

| Component | Change |
|---|---|
| Prisma schema (project DB) | **New** `WalkinStaging` model + `WalkinStagingStatus` enum |
| `beneficiaries.service.ts` | **New** `syncToStaging()` method (lightweight DB write) |
| `beneficiaries.controller.ts` | **New** `@MessagePattern` for `JOBS.BENEFICIARY.SYNC_WALKIN_STAGING` |
| `libs/extensions/src/constants` | **New** job constant `SYNC_WALKIN_STAGING` |
| `libs/cva/src/lib/processors/` | **New** `staging.worker.ts` — cron that processes PENDING rows |
| `contract.processor.ts` | **Modified** — on job completion, update staging row status |
| Vendor app `useSyncWalkInBeneficiaries` | **Modified** — call `syncStaging` instead of `createBulk` |
| `useCreateWalkInBeneficiary` (online) | **No change** |
| All Bull queue processors | **No change** (worker feeds into them as-is) |

### What Does NOT Change

- Online single-add flow (`useCreateWalkInBeneficiary` → `createBulk` → existing pipeline)
- Bull queue job processing (`processBulkCreateWalkinBeneficiaries`, `processBulkWalkinDb`, `processBulkWalkinCore`)
- Blockchain transaction logic
- DLQ handling
- Core microservice sync

---

## 3. Staging Table Schema

### Prisma Model

```prisma
enum WalkinStagingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model WalkinStaging {
  id              Int                   @id @default(autoincrement())
  uuid            String                @unique @default(uuid()) @db.Uuid()
  vendorId        String                @db.Uuid()
  vendor          Vendor                @relation(fields: [vendorId], references: [uuid])
  tokenAddress    String
  idempotencyKey  String                @unique
  beneficiaries   Json                  // Array of beneficiary payloads (same shape as createBulk data)
  status          WalkinStagingStatus   @default(PENDING)
  errorMessage    String?
  retryCount      Int                   @default(0)
  createdAt       DateTime              @default(now())
  processedAt     DateTime?
  completedAt     DateTime?

  @@index([status, createdAt])
  @@map("tbl_walkin_staging")
}
```

### Field Descriptions

| Field | Purpose |
|---|---|
| `uuid` | External-facing identifier |
| `vendorId` | FK to `Vendor.uuid` — which vendor submitted this batch |
| `tokenAddress` | Token contract address for blockchain calls |
| `idempotencyKey` | Client-generated key to prevent duplicate staging entries |
| `beneficiaries` | JSON array — exact payload the vendor sends (name, phone, wallet, extras, voucherStatus, etc.) |
| `status` | State machine: `PENDING → PROCESSING → COMPLETED/FAILED` |
| `errorMessage` | Populated on `FAILED` — last error from pipeline |
| `retryCount` | Incremented each time worker attempts processing. Max = 3 before permanent `FAILED`. |
| `processedAt` | Timestamp when worker picked up the row |
| `completedAt` | Timestamp when entire pipeline completed successfully |

### Index

- `@@index([status, createdAt])` — the cron worker queries `WHERE status = 'PENDING' ORDER BY createdAt ASC LIMIT N`, so this composite index is critical.

### Relation

- Add `walkinStagings WalkinStaging[]` to the existing `Vendor` model.

---

## 4. New Endpoint: `syncStaging`

### Constant

```typescript
// libs/extensions/src/constants/index.ts
JOBS.BENEFICIARY.SYNC_WALKIN_STAGING = 'rahat.jobs.beneficiary.sync_walkin_staging';
```

### Controller

```typescript
// apps/kenya/src/beneficiaries/beneficiaries.controller.ts
@MessagePattern({
  cmd: JOBS.BENEFICIARY.SYNC_WALKIN_STAGING,
  uuid: process.env.PROJECT_ID,
})
syncWalkinStaging(payload: any) {
  return this.beneficiariesService.syncToStaging(payload);
}
```

### Service Method

```typescript
// apps/kenya/src/beneficiaries/beneficiaries.service.ts
async syncToStaging(payload: {
  data: any[];
  contractData: { vendorWalletAddress: string; tokenAddress: string };
  idempotencyKey: string;
}) {
  const { data, contractData, idempotencyKey: requestKey } = payload;

  // 1. Validate vendor exists
  const vendor = await this.prisma.vendor.findUniqueOrThrow({
    where: { walletAddress: contractData.vendorWalletAddress },
  });

  // 2. Check CAN_SYNC_WALKIN setting (same as current)
  const settings = new SettingsService(this.prisma);
  let canSyncWalkin;
  try {
    canSyncWalkin = await settings.getPublic('CAN_SYNC_WALKIN');
  } catch (e) {
    canSyncWalkin = { value: 'true' };
  }
  if (canSyncWalkin.value === 'false' || canSyncWalkin.value === false) {
    throw new RpcException('You are not authorized to sync walkin beneficiaries.');
  }

  // 3. Build idempotency key (reuse existing logic)
  const idempotencyKey = this.buildWalkInIdempotencyKey(
    requestKey,
    vendor.walletAddress,
    contractData.tokenAddress,
    data,
  );

  // 4. Upsert staging row (idempotency via unique constraint)
  try {
    const staging = await this.prisma.walkinStaging.create({
      data: {
        vendorId: vendor.uuid,
        tokenAddress: contractData.tokenAddress,
        idempotencyKey,
        beneficiaries: data, // Store raw payload as JSON
        status: 'PENDING',
      },
    });

    return {
      success: true,
      status: 'staged',
      stagingId: staging.uuid,
      idempotencyKey,
    };
  } catch (err: any) {
    // Unique constraint violation = duplicate request
    if (err.code === 'P2002') {
      const existing = await this.prisma.walkinStaging.findUnique({
        where: { idempotencyKey },
        select: { uuid: true, status: true },
      });
      return {
        success: true,
        status: 'already_staged',
        stagingId: existing?.uuid,
        currentStatus: existing?.status,
      };
    }
    throw err;
  }
}
```

### Key Design Decisions

1. **No deduplication at staging time** — the existing pipeline already deduplicates by phone number and wallet address. Doing it twice is wasteful. The staging table just stores what the vendor sent.
2. **Idempotency via DB unique constraint** — faster and more reliable than checking Bull queue jobs.
3. **Response is instant** — single Postgres INSERT. No queue, no blockchain, no external calls.

---

## 5. Cron Worker: Staging Processor

### File Location

```
rahat-project-sms-voucher/libs/cva/src/lib/processors/staging.worker.ts
```

### Implementation Strategy

Use `setInterval` (or NestJS `@nestjs/schedule` `@Interval`) to poll every 30 seconds. The worker:

1. Queries `PENDING` rows (oldest first, batch of 5)
2. Marks them `PROCESSING` (atomic UPDATE with WHERE status = 'PENDING')
3. For each row, calls the existing `bulkSyncWalkinBeneficiaries()` service method
4. On success: marks row `COMPLETED`
5. On failure: increments `retryCount`, sets `errorMessage`, and either:
   - Keeps `PENDING` (if retryCount < 3) for next poll
   - Sets `FAILED` (if retryCount >= 3) — requires manual intervention

### Pseudocode

```typescript
@Injectable()
export class StagingWorker implements OnModuleInit {
  private readonly logger = new Logger(StagingWorker.name);
  private intervalRef: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly beneficiariesService: BeneficiariesService,
  ) {}

  onModuleInit() {
    const intervalMs = parseInt(process.env.STAGING_POLL_INTERVAL_MS || '30000', 10);
    this.intervalRef = setInterval(() => this.processPendingStaging(), intervalMs);
    this.logger.log(`Staging worker started, polling every ${intervalMs}ms`);
  }

  async processPendingStaging() {
    const MAX_BATCH = 5;
    const MAX_RETRIES = 3;

    // 1. Atomically claim PENDING rows
    //    Use raw SQL for atomic claim (SELECT ... FOR UPDATE SKIP LOCKED)
    const rows = await this.prisma.$queryRaw`
      UPDATE "tbl_walkin_staging"
      SET status = 'PROCESSING'::"WalkinStagingStatus",
          "processedAt" = NOW()
      WHERE id IN (
        SELECT id FROM "tbl_walkin_staging"
        WHERE status = 'PENDING'::"WalkinStagingStatus"
        ORDER BY "createdAt" ASC
        LIMIT ${MAX_BATCH}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `;

    if (!rows || rows.length === 0) return;

    this.logger.log(`Processing ${rows.length} staging row(s)`);

    for (const row of rows) {
      try {
        // 2. Feed into existing pipeline (same payload shape as createBulk)
        await this.beneficiariesService.bulkSyncWalkinBeneficiaries({
          data: row.beneficiaries,
          contractData: {
            vendorWalletAddress: (await this.prisma.vendor.findUnique({
              where: { uuid: row.vendorId },
            }))?.walletAddress,
            tokenAddress: row.tokenAddress,
          },
          idempotencyKey: row.idempotencyKey,
        });

        // 3. Mark completed
        await this.prisma.walkinStaging.update({
          where: { id: row.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        this.logger.log(`Staging row ${row.uuid} completed`);
      } catch (err: any) {
        const newRetryCount = row.retryCount + 1;
        const newStatus = newRetryCount >= MAX_RETRIES ? 'FAILED' : 'PENDING';

        await this.prisma.walkinStaging.update({
          where: { id: row.id },
          data: {
            status: newStatus,
            retryCount: newRetryCount,
            errorMessage: err.message?.slice(0, 500),
          },
        });

        this.logger.error(
          `Staging row ${row.uuid} failed (attempt ${newRetryCount}/${MAX_RETRIES}): ${err.message}`
        );
      }
    }
  }

  onModuleDestroy() {
    if (this.intervalRef) clearInterval(this.intervalRef);
  }
}
```

### Concurrency Safety

- **`FOR UPDATE SKIP LOCKED`** ensures multiple worker instances (if scaled) don't process the same row.
- **Atomic status transition** — no race between reading and updating.
- **Idempotency** — the existing pipeline already handles duplicate jobs via Bull job ID checks. If the worker re-submits the same staging row, the pipeline will detect duplicates and skip.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `STAGING_POLL_INTERVAL_MS` | `30000` | How often the worker polls for PENDING rows |
| `STAGING_BATCH_SIZE` | `5` | Max rows per poll cycle |
| `STAGING_MAX_RETRIES` | `3` | Max attempts before marking FAILED |

---

## 6. Status Callback (Pipeline → Staging)

### When does the staging row status change?

The staging worker calls `bulkSyncWalkinBeneficiaries()` which enqueues Bull jobs. The challenge: Bull jobs are async, so the worker doesn't know when the full pipeline completes.

### Approach: Optimistic Completion

Mark the staging row `COMPLETED` when `bulkSyncWalkinBeneficiaries()` returns successfully (meaning jobs were enqueued). This is because:

1. The staging table's purpose is to **decouple sync from pipeline** — once data enters the queue, the staging table's job is done.
2. Bull queue has its own retry/DLQ mechanisms for pipeline failures.
3. The staging row represents "vendor data received and submitted for processing", not "beneficiary fully created on-chain".

If the enqueue itself fails (e.g., Redis down), the staging row stays `PROCESSING` and will be retried.

### Alternative (if explicit end-to-end tracking is needed later)

Add a `QUEUED` status between `PROCESSING` and `COMPLETED`, and have the final Bull processor (`processBulkWalkinCore`) emit an event that updates the staging row. This is more complex and not needed for MVP.

---

## 7. Client-Side Changes (Vendor App)

### File: `useSyncWalkInBeneficiaries` hook

**Current**: Calls `rpProject.walkin.createBulk` (which maps to `JOBS.BENEFICIARY.CREATE_BULK_WALKIN_BENEFICIARIES`)

**Proposed**: Call a new method `rpProject.walkin.syncStaging` (which maps to `JOBS.BENEFICIARY.SYNC_WALKIN_STAGING`)

### Changes Required

1. **SDK/client**: Add `syncStaging` method to the walkin client that calls the new endpoint
2. **Hook**: Replace `rpProject.walkin.createBulk(payload)` with `rpProject.walkin.syncStaging(payload)`
3. **Response handling**: The response shape changes from `{ success, status: 'queued', jobIds, ... }` to `{ success, status: 'staged', stagingId, ... }`
4. **On success**: Same behavior — mark `isSentForSync: true` and set `IN_PROGRESS`

### What stays the same

- Payload shape (same `data` + `contractData` + `idempotencyKey`)
- `useCreateWalkInBeneficiary` (online single-add) — **completely unchanged**
- `useGetSyncedWalkInBeneficiaries` (status polling) — **unchanged** (it polls server for beneficiary creation status, which still comes from the existing pipeline)
- `useWalkInSyncTimeout` (timeout reset) — **unchanged**

---

## 8. State Machine

```
PENDING ──(worker picks up)──→ PROCESSING ──(enqueue success)──→ COMPLETED
    ↑                              │
    │                              ├──(enqueue fails, retryCount < 3)──→ PENDING
    │                              │
    └──────────────────────────────├──(retryCount >= 3)──→ FAILED
```

### Status Definitions

| Status | Meaning | Next Transition |
|---|---|---|
| `PENDING` | Waiting for worker pickup | → `PROCESSING` |
| `PROCESSING` | Worker is feeding data into pipeline | → `COMPLETED` or → `PENDING` (retry) or → `FAILED` |
| `COMPLETED` | Data successfully submitted to existing pipeline | Terminal |
| `FAILED` | Max retries exceeded | Terminal (manual intervention) |

---

## 9. Migration Plan

### Phase 1: Backend (no client changes)

1. Add Prisma migration (`WalkinStaging` model + `WalkinStagingStatus` enum)
2. Add `SYNC_WALKIN_STAGING` constant to `JOBS.BENEFICIARY`
3. Implement `syncToStaging()` in `beneficiaries.service.ts`
4. Add `@MessagePattern` in controller
5. Implement `StagingWorker` with cron
6. Register worker in the appropriate NestJS module
7. **Test**: Call `syncStaging` endpoint directly → verify row appears in `tbl_walkin_staging` → verify worker picks it up → verify existing pipeline runs

### Phase 2: Client (swap endpoint)

1. Add `syncStaging` method to vendor app SDK/client
2. Update `useSyncWalkInBeneficiaries` to call `syncStaging`
3. **Test**: Full offline → online → sync cycle

### Phase 3: Cleanup (optional, after validation)

1. Consider removing direct `createBulk` access for offline sync (or keep as fallback)
2. Add admin UI to view/retry/clear staging rows
3. Add monitoring/alerts for `FAILED` staging rows

---

## 10. Risk Assessment

| Risk | Mitigation |
|---|---|
| Staging table grows unbounded | Add cleanup cron: delete `COMPLETED` rows older than 30 days |
| Worker crashes mid-processing | `FOR UPDATE SKIP LOCKED` + retry mechanism. Row stays `PROCESSING` until next restart picks it up (could add stale detection: reset `PROCESSING` rows older than 5 min back to `PENDING`) |
| Dual-write during migration | Phase 1 deploys backend only. Client still uses `createBulk`. Phase 2 swaps client. No dual-write period. |
| Idempotency key collision | Same key generation as current flow. Unique DB constraint catches duplicates gracefully. |
| Vendor sees stale status | No change to status polling — `useGetSyncedWalkInBeneficiaries` already polls the beneficiary table, not the staging table. |

---

## 11. Monitoring

### Queries for Ops

```sql
-- Pending staging rows (should be near 0 if worker is healthy)
SELECT COUNT(*) FROM tbl_walkin_staging WHERE status = 'PENDING';

-- Failed staging rows (needs manual attention)
SELECT * FROM tbl_walkin_staging WHERE status = 'FAILED' ORDER BY "createdAt" DESC;

-- Processing for too long (possible stuck worker)
SELECT * FROM tbl_walkin_staging
WHERE status = 'PROCESSING'
AND "processedAt" < NOW() - INTERVAL '5 minutes';

-- Average staging-to-completion time
SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt"))) as avg_seconds
FROM tbl_walkin_staging WHERE status = 'COMPLETED';
```

---

## 12. Diagram Reference

See: `rahat-platform/docs/diagrams/walkin-beneficiary-flow.excalidraw.json`

Contains:
- **Top section**: Client-side walk-in flow (Steps 1–5)
- **Bottom section**: Current vs Proposed architecture comparison with staging table schema preview
