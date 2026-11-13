# Rahat Platform

Core platform that owns beneficiaries, wallets and settings, and hosts projects (e.g. the Stellar AA project) that act on them.

## Language

### Stellar sponsorship

**Core Sponsor**:
The single Stellar account, configured in platform settings, whose XLM backs the reserves of every sponsored beneficiary account across all projects.
_Avoid_: Central sponsor, master sponsor, platform wallet

**Project Sponsor**:
A project's own Stellar account. It is the transaction source for sponsorship transactions (pays fees, supplies sequence number) and holds XLM for project actions, but does not back beneficiary reserves under the core flow.
_Avoid_: Channel account, project wallet

**Reserve**:
The XLM locked on the account that sponsors a beneficiary's Stellar account and trustline (about 1.5 XLM per beneficiary).
_Avoid_: Deposit, stake

**Sponsored Beneficiary Account**:
A beneficiary's Stellar account whose reserve is held by a sponsor rather than by the beneficiary.
_Avoid_: Funded account

**Legacy Sponsored Account**:
A sponsored beneficiary account whose reserve is held by a Project Sponsor, created before the Core Sponsor existed.
_Avoid_: Old account

**Close-out**:
Closing a beneficiary's trustline and merging the account away, which releases its reserve back to whichever sponsor held it.
_Avoid_: Revoke, teardown

**Core Signing**:
Platform adding the Core Sponsor's signature to a sponsorship transaction a project built, after validating it.
_Avoid_: Co-sign, remote sign
