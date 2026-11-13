import { Account, Asset, Keypair, Networks, Operation, TransactionBuilder, xdr } from '@stellar/stellar-sdk';
import {
  MAX_SPONSORED_ACCOUNTS_PER_TX,
  SponsorshipTxRejectedError,
  validateSponsorshipTx,
} from './validate-sponsorship-tx';

const core = Keypair.random().publicKey();
const project = Keypair.random().publicKey();
const asset = new Asset('RAHAT', Keypair.random().publicKey());

const build = (ops: xdr.Operation[], source = project) => {
  const builder = new TransactionBuilder(new Account(source, '1'), {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  });
  ops.forEach((op) => builder.addOperation(op));
  return builder.setTimeout(100).build();
};

// Same shape as createSponsoredAccountsBatch in rahat-project-aa.
const createBlock = (id: string) => [
  Operation.beginSponsoringFutureReserves({ sponsoredId: id, source: core }),
  Operation.createAccount({ destination: id, startingBalance: '0' }),
  Operation.endSponsoringFutureReserves({ source: id }),
];
const trustBlock = (id: string) => [
  Operation.beginSponsoringFutureReserves({ sponsoredId: id, source: core }),
  Operation.changeTrust({ asset, source: id }),
  Operation.endSponsoringFutureReserves({ source: id }),
];

const expectRejected = (ops: xdr.Operation[], match: RegExp, source = project) =>
  expect(() => validateSponsorshipTx(build(ops, source), core)).toThrow(
    expect.objectContaining({ constructor: SponsorshipTxRejectedError, message: expect.stringMatching(match) })
  );

describe('validateSponsorshipTx', () => {
  it('accepts create + trustline blocks and counts reserve', () => {
    const a = Keypair.random().publicKey();
    const b = Keypair.random().publicKey();
    const summary = validateSponsorshipTx(build([...createBlock(a), ...trustBlock(a), ...trustBlock(b)]), core);
    expect(summary.sponsoredAccounts.sort()).toEqual([a, b].sort());
    expect(summary.reserveUnits).toBe(2 + 1 + 1);
  });

  it('rejects core as the transaction source', () => {
    expectRejected(createBlock(Keypair.random().publicKey()), /transaction source/, core);
  });

  it('rejects a payment out of core', () => {
    const a = Keypair.random().publicKey();
    expectRejected(
      [
        Operation.beginSponsoringFutureReserves({ sponsoredId: a, source: core }),
        Operation.payment({ destination: a, asset: Asset.native(), amount: '100', source: core }),
        Operation.endSponsoringFutureReserves({ source: a }),
      ],
      /payment is not allowed/
    );
  });

  it('rejects a nonzero startingBalance', () => {
    const a = Keypair.random().publicKey();
    const [begin, , end] = createBlock(a);
    expectRejected([begin, Operation.createAccount({ destination: a, startingBalance: '1' }), end], /startingBalance/);
  });

  it('rejects a createAccount funded by core', () => {
    const a = Keypair.random().publicKey();
    const [begin, , end] = createBlock(a);
    expectRejected(
      [begin, Operation.createAccount({ destination: a, startingBalance: '0', source: core }), end],
      /cannot fund/
    );
  });

  it('rejects a begin not sourced from core', () => {
    const a = Keypair.random().publicKey();
    const [, op, end] = createBlock(a);
    expectRejected([Operation.beginSponsoringFutureReserves({ sponsoredId: a }), op, end], /sourced from the core/);
  });

  it('rejects an unpaired begin', () => {
    const a = Keypair.random().publicKey();
    expectRejected([...createBlock(a).slice(0, 2), ...createBlock(a)], /begin\/op\/end blocks/);
  });

  it('rejects an end for a different account', () => {
    const a = Keypair.random().publicKey();
    const [begin, op] = createBlock(a);
    expectRejected([begin, op, Operation.endSponsoringFutureReserves({ source: project })], /end must be sourced/);
  });

  it('rejects a trustline removal', () => {
    const a = Keypair.random().publicKey();
    const [begin, , end] = trustBlock(a);
    expectRejected([begin, Operation.changeTrust({ asset, limit: '0', source: a }), end], /add a trustline/);
  });

  it(`rejects more than ${MAX_SPONSORED_ACCOUNTS_PER_TX} accounts`, () => {
    const ops = Array.from({ length: MAX_SPONSORED_ACCOUNTS_PER_TX + 1 }, () => trustBlock(Keypair.random().publicKey())).flat();
    expectRejected(ops, /at most 16/);
  });

  it('survives an XDR round trip', () => {
    const a = Keypair.random().publicKey();
    const parsed = TransactionBuilder.fromXDR(build(createBlock(a)).toXDR(), Networks.TESTNET);
    expect(validateSponsorshipTx(parsed, core).sponsoredAccounts).toEqual([a]);
  });
});
