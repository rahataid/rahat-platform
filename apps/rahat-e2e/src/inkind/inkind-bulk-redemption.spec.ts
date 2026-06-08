import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import request from 'supertest';
import {
  generateBeneficiaryDto,
  generatePreDefinedInkindDto,
  generateVendorDto,
} from './testFixtureData';

type HttpResponse = {
  statusCode: number;
  body: any;
};

function asHttpResponse(res: unknown): HttpResponse {
  return res as HttpResponse;
}

dotenv.config();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VENDOR_COUNT = 1;
const BENEFICIARY_COUNT = 100;
const PRE_DEFINED_INKIND_COUNT = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface VendorEntry {
  id: number;
  uuid: string;
  wallet: string;
  name: string;
  email: string;
  phone: string;
  header: string;
}

interface BenfEntry {
  uuid: string;
  walletAddress: string;
}

// ---------------------------------------------------------------------------
// Token generator — mirrors AuthsService.signToken without NestJS bootstrap
// ---------------------------------------------------------------------------
const jwtService = new JwtService({});
const prisma = new PrismaClient();

// Timeout wrapper for HTTP requests to prevent infinite hangs
function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 30000,
  label: string = 'request',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`⏱️  ${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

function generateAccessToken(
  user: {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone?: string | null;
    wallet: string;
  },
  roles: string[] = [process.env.ROLE_NAME ?? 'Admin'],
): string {
  const secret = crypto
    .createHash('sha256')
    .update(process.env.PRIVATE_KEY!)
    .digest('hex');
  const payload = {
    id: user.id,
    userId: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    wallet: user.wallet,
    roles,
    permissions: [
      { action: 'manage', subject: 'all', inverted: false, conditions: null },
    ],
    sessionId: null,
  };
  const token = jwtService.sign(payload, {
    secret,
    expiresIn: process.env.JWT_EXPIRATION_TIME ?? '1d',
  });
  return `Bearer ${token}`;
}

describe('Inkind Bulk Offline Redemption E2E', () => {
  let adminHeader: string;
  let groupUuid: string;

  const baseUrl = 'http://localhost:5500';
  const projectUuid = '2ff33d0f-c5cc-4c95-ab3b-77403c9b5d0d'; // Known valid project UUID

  const vendors: VendorEntry[] = [];
  const beneficiaries: BenfEntry[] = [];
  const predefinedInkindUuids: string[] = [];

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  async function projectAction(
    action: string,
    payload: object,
    authHeader = adminHeader,
  ) {
    return request(baseUrl)
      .post(`/v1/projects/${projectUuid}/actions`)
      .set('Authorization', authHeader)
      .send({ action, payload });
  }

  // -----------------------------------------------------------------------
  // Global setup
  // -----------------------------------------------------------------------
  beforeAll(async () => {
    console.log('📋 beforeAll: Starting setup...');

    // Admin JWT
    adminHeader = generateAccessToken({
      id: 1,
      uuid: process.env.UUID!,
      name: process.env.NAME!,
      email: process.env.EMAIL!,
      wallet: process.env.WALLET!,
    });

    // Create a group
    const groupRes = await projectAction('aaProject.groups.create', {
      name: 'Bulk Redemption Group',
    });
    groupUuid = groupRes.body.data.uuid;
    expect(groupUuid).toBeDefined();

    // Step 1: Create vendor
    const vendorInput = generateVendorDto();
    const vendorRes = await withTimeout(
      request(baseUrl).post('/v1/vendors').send(vendorInput.dto),
      15000,
      `POST /v1/vendors`,
    ) as any;
    expect(vendorRes.statusCode).toBe(201);
    const vendorJwt = generateAccessToken({
      id: vendorRes.body.data.id,
      uuid: vendorRes.body.data.uuid,
      name: vendorInput.dto.name,
      email: vendorInput.dto.email,
      phone: vendorInput.dto.phone,
      wallet: vendorInput.wallet.address,
    });
    vendors.push({
      id: vendorRes.body.data.id,
      uuid: vendorRes.body.data.uuid,
      wallet: vendorInput.wallet.address,
      name: vendorInput.dto.name,
      email: vendorInput.dto.email,
      phone: vendorInput.dto.phone,
      header: vendorJwt,
    });
    expect(vendors).toHaveLength(VENDOR_COUNT);

    // Step 2: Register vendor as stakeholder and assign to project
    await projectAction('aaProject.stakeholders.add', {
      uuid: vendors[0].uuid,
      name: vendors[0].name,
      email: vendors[0].email,
      phone: vendors[0].phone,
      designation: 'Vendor',
      organization: 'Rahat E2E',
      district: 'Kathmandu',
      municipality: 'Ward 1',
    });
    await projectAction('vendor.assign_to_project', {
      vendorId: vendors[0].uuid,
    });

    // Step 3: Create beneficiaries
    for (let i = 0; i < BENEFICIARY_COUNT; i++) {
      const benfDto = generateBeneficiaryDto();
      const benfRes = await withTimeout(
        request(baseUrl)
          .post('/v1/beneficiaries')
          .set('Authorization', adminHeader)
          .send(benfDto.dto),
      ) as any;
      expect(benfRes.statusCode).toBe(201);
      beneficiaries.push({
        uuid: benfRes.body.data.uuid,
        walletAddress: benfRes.body.data.walletAddress,
      });
      // Assign to group
      await projectAction('aaProject.beneficiaries.assignToGroup', {
        beneficiaryId: benfRes.body.data.uuid,
        groupId: groupUuid,
      });
    }
    expect(beneficiaries).toHaveLength(BENEFICIARY_COUNT);

    // Step 4: Create pre-defined inkinds
    for (let i = 0; i < PRE_DEFINED_INKIND_COUNT; i++) {
            const inkindDto = generatePreDefinedInkindDto();
      const inkindRes = await projectAction('aa.inkinds.create', inkindDto);
      expect(inkindRes.body?.data?.uuid).toBeDefined();
      predefinedInkindUuids.push(inkindRes.body.data.uuid);
    }
    expect(predefinedInkindUuids).toHaveLength(PRE_DEFINED_INKIND_COUNT);

    // Step 5: Assign inkinds to the group in OFFLINE mode
    for (const inkindId of predefinedInkindUuids) {
      const assignRes = await projectAction(
        'aaProject.groupInkinds.assign',
        {
          inkindId: inkindId,
          groupId: groupUuid,
          mode: 'OFFLINE',
          payoutProcessorId: vendors[0].uuid,
        },
      );
      expect(assignRes.statusCode).toBe(201);
    }
  }, 600_000);

  it('should fetch offline beneficiaries for a vendor and then bulk sync redemptions', async () => {
    // 1. Get offline beneficiaries for the vendor
    const getBenfRes = await projectAction(
      'aaProject.inkinds.getAllOfflineBeneficiaryByVendor',
      {
        vendorId: vendors[0].uuid,
      },
      vendors[0].header,
    );

    expect(getBenfRes.statusCode).toBe(200);
    expect(getBenfRes.body.success).toBe(true);
    const offlineBeneficiaries = getBenfRes.body.data.beneficiaries;
    expect(offlineBeneficiaries.length).toBe(BENEFICIARY_COUNT);

    // 2. Construct the bulk redemption payload
    const redeemedInkinds = offlineBeneficiaries.map((benf: any) => ({
      beneficiaryWallet: benf.walletAddress,
      inkindRedeemed: benf.inkinds.map((inkind: any) => ({
        uuid: inkind.id,
        groupInkindId: inkind.groupInkindId,
      })),
      redeemedAt: new Date().toISOString(),
    }));

    // 3. Sync offline redemptions
    const syncRes = await projectAction(
      'aaProject.inkinds.syncOfflineRedemptions',
      {
        redeemedInkinds,
      },
      vendors[0].header,
    );

    expect(syncRes.statusCode).toBe(200);
    expect(syncRes.body.success).toBe(true);
  }, 120_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
});
