import { Asset, FeeBumpTransaction, Operation, Transaction } from '@stellar/stellar-sdk';

/** Mirrors MAX_ACCOUNTS_PER_BATCH in rahat-project-aa libs/stellar/src/operations/account.ts. */
export const MAX_SPONSORED_ACCOUNTS_PER_TX = 16;

/** Reserve units (0.5 XLM each) a sponsored entry locks on the sponsor. */
const RESERVE_UNITS = { createAccount: 2, changeTrust: 1 } as const;

export interface SponsorshipTxSummary {
  /** Distinct accounts the Core Sponsor will back. */
  sponsoredAccounts: string[];
  /** Base-reserve units the Core Sponsor will lock once the tx lands. */
  reserveUnits: number;
}

export class SponsorshipTxRejectedError extends Error {}

const reject = (reason: string): never => {
  throw new SponsorshipTxRejectedError(reason);
};

/**
 * Checks a project-built sponsorship tx before the Core Sponsor signs it. The tx must be a
 * sequence of blocks exactly as createSponsoredAccountsBatch builds them:
 *
 *   beginSponsoringFutureReserves(source = core, sponsoredId = X)
 *   createAccount(destination = X, startingBalance = 0) | changeTrust(source = X, adds a trustline)
 *   endSponsoringFutureReserves(source = X)
 *
 * Anything else is refused, so the core signature can only ever lock reserve for X, never move
 * core funds. Whether X is a beneficiary of the calling project is checked by the caller.
 */
export function validateSponsorshipTx(
  tx: Transaction | FeeBumpTransaction,
  corePublicKey: string
): SponsorshipTxSummary {
  if (tx instanceof FeeBumpTransaction) reject('fee bump transactions are not signed');
  const inner = tx as Transaction;

  if (inner.source === corePublicKey) reject('core sponsor cannot be the transaction source');

  const ops = inner.operations;
  if (ops.length === 0 || ops.length % 3 !== 0) reject('operations must come in begin/op/end blocks');

  const accounts = new Set<string>();
  let reserveUnits = 0;

  for (let i = 0; i < ops.length; i += 3) {
    const [begin, op, end] = [ops[i], ops[i + 1], ops[i + 2]];

    if (begin.type !== 'beginSponsoringFutureReserves') reject(`op ${i}: expected beginSponsoringFutureReserves`);
    const { sponsoredId } = begin as Operation.BeginSponsoringFutureReserves;
    if (begin.source !== corePublicKey) reject(`op ${i}: begin must be sourced from the core sponsor`);
    if (sponsoredId === corePublicKey) reject(`op ${i}: core sponsor cannot sponsor itself`);

    if (op.type === 'createAccount') {
      const create = op as Operation.CreateAccount;
      if (op.source === corePublicKey) reject(`op ${i + 1}: core sponsor cannot fund an account`);
      if (create.destination !== sponsoredId) reject(`op ${i + 1}: createAccount destination is not the sponsored account`);
      if (Number(create.startingBalance) !== 0) reject(`op ${i + 1}: createAccount startingBalance must be 0`);
      reserveUnits += RESERVE_UNITS.createAccount;
    } else if (op.type === 'changeTrust') {
      const trust = op as Operation.ChangeTrust;
      if (op.source !== sponsoredId) reject(`op ${i + 1}: changeTrust must be sourced from the sponsored account`);
      if (!(trust.line instanceof Asset) || trust.line.isNative()) reject(`op ${i + 1}: changeTrust must target a classic asset`);
      if (Number(trust.limit) === 0) reject(`op ${i + 1}: changeTrust must add a trustline, not remove one`);
      reserveUnits += RESERVE_UNITS.changeTrust;
    } else {
      reject(`op ${i + 1}: ${op.type} is not allowed`);
    }

    if (end.type !== 'endSponsoringFutureReserves') reject(`op ${i + 2}: expected endSponsoringFutureReserves`);
    if (end.source !== sponsoredId) reject(`op ${i + 2}: end must be sourced from the sponsored account`);

    accounts.add(sponsoredId);
  }

  if (accounts.size > MAX_SPONSORED_ACCOUNTS_PER_TX) {
    reject(`at most ${MAX_SPONSORED_ACCOUNTS_PER_TX} sponsored accounts per transaction (got ${accounts.size})`);
  }

  return { sponsoredAccounts: [...accounts], reserveUnits };
}
