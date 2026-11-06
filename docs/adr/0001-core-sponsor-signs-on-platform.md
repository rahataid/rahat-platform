# Core Sponsor reserves are signed on the platform, never copied to projects

Stellar beneficiary reserves are held by one Core Sponsor in platform settings, so XLM is a central pool instead of a reserve per project. Projects build the sponsorship transaction with their Project Sponsor as source (fee and sequence) and the Core Sponsor as `beginSponsoringFutureReserves` source, then ask platform to add the Core Sponsor signature. The Core Sponsor secret never leaves platform, so a compromised project cannot drain the central reserve.

Platform signs only after validating the transaction:

- Only allowed operations (`beginSponsoringFutureReserves`, zero-balance `createAccount`, `changeTrust` that adds a trustline, `endSponsoringFutureReserves`), with every begin paired to an end.
- Core is the source of nothing except `beginSponsoringFutureReserves`, and is never the transaction source.
- Every sponsored account is a wallet of a beneficiary assigned to the calling project.
- Batch size within the creation limit in `libs/stellar/src/operations/account.ts` (16).

The Project Sponsor is not pinned or registered on platform. Its only power is spending its own XLM on fees.

## Consequences

- Without a Core Sponsor in platform settings, projects fall back to the single-sponsor flow.
- Close-out needs no Core Signing: its operations are sourced from the beneficiary account, and the ledger releases the reserve to whichever sponsor held it. Accounts merge into the Core Sponsor, so Legacy Sponsored Accounts keep working unchanged. They are not migrated, since beneficiaries hold no XLM to cover a revoke-and-responsor gap.
- Funds check is advisory at assign time and authoritative at signing time. Two projects can both pass the advisory check and one batch then fails, to be retried after a top-up. A reservation ledger that locks and releases XLM is deferred, and would slot in as a reserved amount subtracted before the free-XLM check.
