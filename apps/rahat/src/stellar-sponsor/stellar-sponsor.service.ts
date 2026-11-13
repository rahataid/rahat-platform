import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@rumsan/prisma';
import { Horizon, Keypair, Networks, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import { SponsorshipTxRejectedError, validateSponsorshipTx } from './validate-sponsorship-tx';

const SETTING_NAME = 'STELLAR_CORE_SPONSOR_SETTINGS';
const STROOPS_PER_XLM = 10_000_000;
const BASE_RESERVE_STROOPS = 0.5 * STROOPS_PER_XLM;
/** Longest validity window accepted, so a signed-but-unsubmitted tx stops counting as pending soon. */
const MAX_TX_VALIDITY_SECONDS = 300;

const HORIZON_URLS = { mainnet: 'https://horizon.stellar.org', testnet: 'https://horizon-testnet.stellar.org' };
const PASSPHRASES = { mainnet: Networks.PUBLIC, testnet: Networks.TESTNET };

interface CoreSponsorSettings {
  network: 'mainnet' | 'testnet';
  horizonUrl?: string;
  sponsorSecret: string;
}

interface CoreSponsor {
  keypair: Keypair;
  server: Horizon.Server;
  networkPassphrase: string;
}

export interface SignSponsorshipTxDto {
  projectUuid: string;
  xdr: string;
}

const rpcError = (code: string, message: string, params?: Record<string, unknown>) =>
  new RpcException({ message: `[${code}] ${message}`, code, params });

@Injectable()
export class StellarSponsorService {
  private readonly logger = new Logger(StellarSponsorService.name);
  // Signing runs one at a time so the funds check sees the reserve of every tx signed before it.
  // ponytail: per-process; with several platform replicas use a Redis lock (or the reservation ledger)
  private queue: Promise<unknown> = Promise.resolve();
  // Reserve of txs signed here but possibly not yet on-chain, keyed by tx hash, until they expire.
  // ponytail: a landed tx counts twice (chain + pending) until its maxTime passes; errs on the safe side
  private readonly pending = new Map<string, { stroops: number; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  /** Null when no Core Sponsor is configured, which tells projects to use their own sponsor. */
  async getCoreSponsorStatus(): Promise<{ publicKey: string; networkPassphrase: string; freeStroops: number } | null> {
    const core = await this.loadCoreSponsor();
    if (!core) return null;
    return {
      publicKey: core.keypair.publicKey(),
      networkPassphrase: core.networkPassphrase,
      freeStroops: await this.freeStroops(core),
    };
  }

  signSponsorshipTx(dto: SignSponsorshipTxDto): Promise<{ xdr: string }> {
    const run = this.queue.then(() => this.sign(dto));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async sign({ projectUuid, xdr }: SignSponsorshipTxDto): Promise<{ xdr: string }> {
    if (typeof projectUuid !== 'string' || !projectUuid || typeof xdr !== 'string' || !xdr) {
      throw rpcError('INVALID_SPONSORSHIP_REQUEST', 'projectUuid and xdr are required');
    }

    const core = await this.loadCoreSponsor();
    if (!core) throw rpcError('CORE_SPONSOR_NOT_CONFIGURED', `${SETTING_NAME} is not configured`);

    let tx: Transaction;
    try {
      const parsed = TransactionBuilder.fromXDR(xdr, core.networkPassphrase);
      if (!(parsed instanceof Transaction)) throw new Error('fee bump transactions are not signed');
      tx = parsed;
    } catch (error) {
      throw rpcError('SPONSORSHIP_TX_REJECTED', `could not parse transaction: ${(error as Error).message}`);
    }

    let summary: ReturnType<typeof validateSponsorshipTx>;
    try {
      summary = validateSponsorshipTx(tx, core.keypair.publicKey());
    } catch (error) {
      if (error instanceof SponsorshipTxRejectedError) throw rpcError('SPONSORSHIP_TX_REJECTED', error.message);
      throw error;
    }

    const now = Math.floor(Date.now() / 1000);
    const maxTime = Number(tx.timeBounds?.maxTime ?? 0);
    if (!maxTime || maxTime > now + MAX_TX_VALIDITY_SECONDS) {
      throw rpcError('SPONSORSHIP_TX_REJECTED', `transaction must expire within ${MAX_TX_VALIDITY_SECONDS}s`);
    }

    await this.assertAssignedToProject(projectUuid, summary.sponsoredAccounts);

    const required = summary.reserveUnits * BASE_RESERVE_STROOPS;
    const free = await this.freeStroops(core);
    if (free < required) {
      this.logger.warn(`Core sponsor has ${free / STROOPS_PER_XLM} XLM free, ${required / STROOPS_PER_XLM} XLM needed (project ${projectUuid})`);
      throw rpcError('INSUFFICIENT_SPONSOR_FUNDS', 'Not enough funds in the core sponsor wallet to complete sponsorship.', {
        sponsorWallet: core.keypair.publicKey(),
        beneficiaries: summary.sponsoredAccounts.length,
        requiredXlm: required / STROOPS_PER_XLM,
        availableXlm: free / STROOPS_PER_XLM,
        shortfallXlm: (required - free) / STROOPS_PER_XLM,
      });
    }

    tx.sign(core.keypair);
    this.pending.set(tx.hash().toString('hex'), { stroops: required, expiresAt: maxTime });
    this.logger.log(`Signed sponsorship of ${summary.sponsoredAccounts.length} account(s) for project ${projectUuid}`);
    return { xdr: tx.toXDR() };
  }

  /** Every sponsored account must be a wallet of a beneficiary ever assigned to the project. */
  private async assertAssignedToProject(projectUuid: string, addresses: string[]) {
    // The project holds the chain-specific WalletAddress when one exists, else Beneficiary.walletAddress.
    const [wallets, beneficiaries] = await Promise.all([
      this.prisma.walletAddress.findMany({
        where: { address: { in: addresses } },
        select: { address: true, entityId: true },
      }),
      this.prisma.beneficiary.findMany({
        where: { walletAddress: { in: addresses } },
        select: { walletAddress: true, uuid: true },
      }),
    ]);
    const owner = new Map<string, string>();
    beneficiaries.forEach((b) => owner.set(b.walletAddress, b.uuid));
    wallets.forEach((w) => owner.set(w.address, w.entityId));

    // No deletedAt filter: a beneficiary unassigned after the batch was queued still counts.
    const assigned = await this.prisma.beneficiaryProject.findMany({
      where: { projectId: projectUuid, beneficiaryId: { in: [...new Set(owner.values())] } },
      select: { beneficiaryId: true },
    });
    const assignedIds = new Set(assigned.map((a) => a.beneficiaryId));

    const unknown = addresses.filter((a) => !assignedIds.has(owner.get(a) ?? ''));
    if (unknown.length) {
      throw rpcError('SPONSORSHIP_TX_REJECTED', `accounts are not beneficiaries of project ${projectUuid}`, { accounts: unknown });
    }
  }

  /** Native balance the core can still lock: balance minus Stellar's minimum balance minus pending reserve. */
  private async freeStroops(core: CoreSponsor): Promise<number> {
    let account: Horizon.AccountResponse;
    try {
      account = await core.server.loadAccount(core.keypair.publicKey());
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) return 0;
      throw error;
    }

    const native = account.balances.find((b): b is Horizon.HorizonApi.BalanceLineNative => b.asset_type === 'native');
    // Horizon returns the sponsorship counters; the SDK's AccountResponse type omits them.
    const { num_sponsoring = 0, num_sponsored = 0 } = account as Horizon.AccountResponse & {
      num_sponsoring?: number;
      num_sponsored?: number;
    };
    const minBalance = (2 + account.subentry_count + num_sponsoring - num_sponsored) * BASE_RESERVE_STROOPS;
    const locked = minBalance + xlmToStroops(native?.selling_liabilities);

    const now = Math.floor(Date.now() / 1000);
    let pending = 0;
    for (const [hash, entry] of this.pending) {
      if (entry.expiresAt < now) this.pending.delete(hash);
      else pending += entry.stroops;
    }

    return Math.max(0, xlmToStroops(native?.balance) - locked - pending);
  }

  // Read on every call so a changed setting is picked up without a restart.
  private async loadCoreSponsor(): Promise<CoreSponsor | null> {
    const row = await this.prisma.setting.findUnique({ where: { name: SETTING_NAME } });
    const settings = row?.value as unknown as CoreSponsorSettings | undefined;
    if (!settings?.sponsorSecret) return null;

    const { network } = settings;
    if (network !== 'mainnet' && network !== 'testnet') {
      throw rpcError('INVALID_CORE_SPONSOR_SETTINGS', `${SETTING_NAME}.network must be "mainnet" or "testnet" (got ${JSON.stringify(network)})`);
    }
    let keypair: Keypair;
    try {
      keypair = Keypair.fromSecret(settings.sponsorSecret);
    } catch {
      // never echo the value: it is (meant to be) the core secret
      throw rpcError('INVALID_CORE_SPONSOR_SETTINGS', `${SETTING_NAME}.sponsorSecret is not a valid Stellar secret key`);
    }
    return {
      keypair,
      server: new Horizon.Server(settings.horizonUrl || HORIZON_URLS[network]),
      networkPassphrase: PASSPHRASES[network],
    };
  }
}

/** Horizon returns amounts as 7-decimal strings, e.g. "100.0000000". */
function xlmToStroops(amount: string | undefined): number {
  if (!amount) return 0;
  const [whole, fraction = ''] = amount.split('.');
  return Number(whole) * STROOPS_PER_XLM + Number(fraction.padEnd(7, '0').slice(0, 7));
}
