import { Account, Asset, Horizon, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { StellarSponsorService } from './stellar-sponsor.service';

const core = Keypair.random();
const project = Keypair.random();
const asset = new Asset('RAHAT', Keypair.random().publicKey());
const PROJECT_UUID = '11111111-1111-1111-1111-111111111111';

const sponsorshipXdr = (ids: string[]) => {
  const builder = new TransactionBuilder(new Account(project.publicKey(), '1'), {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  });
  for (const id of ids) {
    builder
      .addOperation(Operation.beginSponsoringFutureReserves({ sponsoredId: id, source: core.publicKey() }))
      .addOperation(Operation.createAccount({ destination: id, startingBalance: '0' }))
      .addOperation(Operation.endSponsoringFutureReserves({ source: id }))
      .addOperation(Operation.beginSponsoringFutureReserves({ sponsoredId: id, source: core.publicKey() }))
      .addOperation(Operation.changeTrust({ asset, source: id }))
      .addOperation(Operation.endSponsoringFutureReserves({ source: id }));
  }
  return builder.setTimeout(100).build().toXDR();
};

const coreAccount = (balance: string) =>
  ({
    balances: [{ asset_type: 'native', balance, selling_liabilities: '0.0000000' }],
    subentry_count: 0,
    num_sponsoring: 0,
    num_sponsored: 0,
  }) as unknown as Horizon.AccountResponse;

describe('StellarSponsorService', () => {
  let prisma: any;
  let service: StellarSponsorService;
  const beneficiaryA = Keypair.random().publicKey();
  const beneficiaryB = Keypair.random().publicKey();

  beforeEach(() => {
    prisma = {
      setting: {
        findUnique: jest.fn().mockResolvedValue({ value: { network: 'testnet', sponsorSecret: core.secret() } }),
      },
      // A is known by its chain-specific WalletAddress, B by Beneficiary.walletAddress.
      walletAddress: { findMany: jest.fn().mockResolvedValue([{ address: beneficiaryA, entityId: 'ben-a' }]) },
      beneficiary: { findMany: jest.fn().mockResolvedValue([{ walletAddress: beneficiaryB, uuid: 'ben-b' }]) },
      beneficiaryProject: {
        findMany: jest.fn().mockResolvedValue([{ beneficiaryId: 'ben-a' }, { beneficiaryId: 'ben-b' }]),
      },
    };
    service = new StellarSponsorService(prisma);
    jest.spyOn(Horizon.Server.prototype, 'loadAccount').mockResolvedValue(coreAccount('100.0000000'));
  });

  afterEach(() => jest.restoreAllMocks());

  it('adds the core signature to a valid tx', async () => {
    const { xdr } = await service.signSponsorshipTx({ projectUuid: PROJECT_UUID, xdr: sponsorshipXdr([beneficiaryA, beneficiaryB]) });
    const signed = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
    expect(signed.signatures).toHaveLength(1);
    expect(core.verify(signed.hash(), signed.signatures[0].signature())).toBe(true);
  });

  it('refuses a wallet not assigned to the project', async () => {
    prisma.beneficiaryProject.findMany.mockResolvedValue([{ beneficiaryId: 'ben-a' }]);
    await expect(
      service.signSponsorshipTx({ projectUuid: PROJECT_UUID, xdr: sponsorshipXdr([beneficiaryA, beneficiaryB]) })
    ).rejects.toMatchObject({ error: expect.objectContaining({ code: 'SPONSORSHIP_TX_REJECTED', params: { accounts: [beneficiaryB] } }) });
  });

  it('counts reserve of earlier signed txs as pending', async () => {
    // 100 XLM - 1 XLM min balance = 99 free; each account locks 1.5 XLM.
    jest.spyOn(Horizon.Server.prototype, 'loadAccount').mockResolvedValue(coreAccount('3.0000000'));
    await service.signSponsorshipTx({ projectUuid: PROJECT_UUID, xdr: sponsorshipXdr([beneficiaryA]) });
    // 3 - 1 min - 1.5 pending = 0.5 free, B needs 1.5
    await expect(
      service.signSponsorshipTx({ projectUuid: PROJECT_UUID, xdr: sponsorshipXdr([beneficiaryB]) })
    ).rejects.toMatchObject({ error: expect.objectContaining({ code: 'INSUFFICIENT_SPONSOR_FUNDS', params: expect.objectContaining({ shortfallXlm: 1 }) }) });
  });

  it('refuses when no core sponsor is configured, and status is null', async () => {
    prisma.setting.findUnique.mockResolvedValue(null);
    await expect(service.getCoreSponsorStatus()).resolves.toBeNull();
    await expect(
      service.signSponsorshipTx({ projectUuid: PROJECT_UUID, xdr: sponsorshipXdr([beneficiaryA]) })
    ).rejects.toMatchObject({ error: expect.objectContaining({ code: 'CORE_SPONSOR_NOT_CONFIGURED' }) });
  });

  it('rejects an invalid network instead of defaulting to testnet', async () => {
    prisma.setting.findUnique.mockResolvedValue({ value: { network: 'mainet', sponsorSecret: core.secret() } });
    await expect(service.getCoreSponsorStatus()).rejects.toMatchObject({
      error: expect.objectContaining({ code: 'INVALID_CORE_SPONSOR_SETTINGS' }),
    });
  });

  it('rejects an invalid secret without echoing it', async () => {
    const publicKeyByMistake = core.publicKey();
    prisma.setting.findUnique.mockResolvedValue({ value: { network: 'testnet', sponsorSecret: publicKeyByMistake } });
    const error = await service.getCoreSponsorStatus().catch((e) => e);
    expect(error.error).toMatchObject({ code: 'INVALID_CORE_SPONSOR_SETTINGS' });
    expect(JSON.stringify(error.error)).not.toContain(publicKeyByMistake);
  });

  it('reports free XLM in status', async () => {
    await expect(service.getCoreSponsorStatus()).resolves.toEqual({
      publicKey: core.publicKey(),
      networkPassphrase: Networks.TESTNET,
      freeStroops: 99 * 10_000_000,
    });
  });
});
