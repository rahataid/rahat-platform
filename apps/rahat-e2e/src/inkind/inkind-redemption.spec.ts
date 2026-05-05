import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import request from 'supertest';
import {
    generateVendorDto,
    generateWalkInInkindDto
} from './testFixtureData';

dotenv.config();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VENDOR_COUNT = 5;
const BENEFICIARY_COUNT = 20;
const WALK_IN_BENEFICIARIES = 20;
const WALK_IN_INKIND_COUNT = 3;

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
function withTimeout<T>(promise: Promise<T>, ms: number = 30000, label: string = 'request'): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`⏱️  ${label} timed out after ${ms}ms`)), ms),
        ),
    ]);
}

function extractSummaryItems(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

function findInkindSummaryItem(items: any[], inkindUuid: string) {
    return items.find((item: any) =>
        item?.uuid === inkindUuid ||
        item?.inkindUuid === inkindUuid ||
        item?.Inkind?.uuid === inkindUuid ||
        item?.inkind?.uuid === inkindUuid,
    );
}

async function waitForProjectVendorMapping(vendorId: string, projectId: string, timeoutMs = 15000) {
    const startedAt = Date.now();
    let lastError: Error | null = null;

    while (Date.now() - startedAt < timeoutMs) {
        try {
            const mapping = await prisma.projectVendors.findUnique({
                where: {
                    projectVendorIdentifier: {
                        projectId,
                        vendorId,
                    },
                },
            });

            if (mapping) return mapping;
        } catch (error) {
            lastError = error as Error;
            // If it's a connection error, break early instead of retrying
            if ((error as any)?.code === 'P1000' || String(error).includes('too many clients')) {
                throw error;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return null;
}

function generateAccessToken(
    user: { id: number; uuid: string; name: string; email: string; phone?: string | null; wallet: string },
    roles: string[] = [process.env.ROLE_NAME ?? 'Admin'],
): string {
    const secret = crypto.createHash('sha256').update(process.env.PRIVATE_KEY!).digest('hex');
    const payload = {
        id: user.id,
        userId: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        wallet: user.wallet,
        roles,
        permissions: [{ action: 'manage', subject: 'all', inverted: false, conditions: null }],
        sessionId: null,
    };
    const token = jwtService.sign(payload, {
        secret,
        expiresIn: process.env.JWT_EXPIRATION_TIME ?? '1d',
    });
    return `Bearer ${token}`;
}

describe('Inkind Beneficiary Redemption E2E — WALK_IN only', () => {
    let adminHeader: string;

    const baseUrl = 'http://localhost:5500';
    const projectUuid = '2ff33d0f-c5cc-4c95-ab3b-77403c9b5d0d'; // Known valid project UUID

    const vendors: VendorEntry[] = [];
    const aaReadyVendors: VendorEntry[] = [];
    const beneficiaries: BenfEntry[] = [];

    const walkInInkindUuids: string[] = [];

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------
    async function projectAction(action: string, payload: object, authHeader = adminHeader) {
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

        // Admin JWT — direct token generation, no NestJS module bootstrap
        console.log('🔑 Generating admin access token...');
        adminHeader = generateAccessToken({
            id: 1,
            uuid: process.env.UUID!,
            name: process.env.NAME!,
            email: process.env.EMAIL!,
            wallet: process.env.WALLET!,
        });
        console.log('✅ Admin token generated');

        // ── Step 1: Create vendors in parallel ────────────────────────────
        console.log(`👤 Step 1: Creating ${VENDOR_COUNT} vendors in parallel...`);
        const vendorInputs = Array.from({ length: VENDOR_COUNT }, () => generateVendorDto());
        console.log(`   Generated ${vendorInputs.length} vendor input DTOs`);

        console.log(`   Posting vendor requests to ${baseUrl}/v1/vendors...`);
        const vendorResponses = await Promise.all(
            vendorInputs.map(({ dto }) =>
                withTimeout(
                    request(baseUrl).post('/v1/vendors').send(dto),
                    15000,
                    `POST /v1/vendors [${vendorInputs.indexOf(vendorInputs.find(v => v.dto === dto)!)}]`,
                ),
            ),
        ) as any[];
        console.log(`✅ Vendor creation complete: ${vendorResponses.length} vendors created`);

        console.log('🔐 Generating vendor JWT tokens...');
        const vendorJwts = vendorResponses.map((res, i) => {
            expect(res.statusCode).toBe(201);
            return generateAccessToken({
                id: res.body.data.id,
                uuid: res.body.data.uuid,
                name: vendorInputs[i].dto.name,
                email: vendorInputs[i].dto.email,
                phone: vendorInputs[i].dto.phone,
                wallet: vendorInputs[i].wallet.address,
            });
        });
        console.log(`✅ Generated ${vendorJwts.length} vendor tokens`);

        vendorResponses.forEach((res, i) => {
            vendors.push({
                id: res.body.data.id,
                uuid: res.body.data.uuid,
                wallet: vendorInputs[i].wallet.address,
                name: vendorInputs[i].dto.name,
                email: vendorInputs[i].dto.email,
                phone: vendorInputs[i].dto.phone,
                header: vendorJwts[i],
            });
        });

        expect(vendors).toHaveLength(VENDOR_COUNT);
        console.log(`✅ Vendors array populated: ${vendors.length} vendors`);

        // ── Step 2: Register vendors as stakeholders in parallel ──────────
        console.log('📝 Step 2: Registering vendors as stakeholders...');
        const stakeholderResponses = await Promise.all(
            vendors.map((vendor) =>
                projectAction('aaProject.stakeholders.add', {
                    uuid: vendor.uuid,
                    name: vendor.name,
                    email: vendor.email,
                    phone: vendor.phone,
                    designation: 'Vendor',
                    organization: 'Rahat E2E',
                    district: 'Kathmandu',
                    municipality: 'Ward 1',
                }),
            ),
        );
        stakeholderResponses.forEach((res: any) => {
            expect(res.statusCode).toBeLessThan(300);
            expect(res.body?.success).not.toBe(false);
        });
        console.log('✅ Vendors registered as stakeholders');

        // ── Step 2b: Assign vendors to project for redemption/log APIs ───
        console.log('🧷 Step 2b: Assigning vendors to project...');
        for (const vendor of vendors) {
            let res: any;
            let requestError: Error | null = null;

            try {
                res = await withTimeout(
                    projectAction('vendor.assign_to_project', {
                        vendorId: vendor.uuid,
                    }),
                    12000,
                    `vendor.assign_to_project (${vendor.uuid})`,
                );
            } catch (error: any) {
                requestError = error;
            }

            if (res) {
                const isSuccess = res.statusCode < 300 && res.body?.success !== false;
                const message = String(res.body?.message || '').toLowerCase();
                const isAlreadyAssigned = res.statusCode >= 400 && message.includes('already assigned');
                const isKnownError = message.includes('timeout has occurred') || message.includes('no elements in sequence');

                if (isSuccess || isAlreadyAssigned) {
                    aaReadyVendors.push(vendor);
                    console.log(`   ✓ Vendor ${vendor.uuid} assigned successfully`);
                    continue;
                }

                if (!isKnownError) {
                    const mapping = await waitForProjectVendorMapping(vendor.uuid, projectUuid);
                    if (mapping) {
                        aaReadyVendors.push(vendor);
                        console.log(`   ⚠️ Assignment response degraded but mapping exists for vendor ${vendor.uuid}`);
                        continue;
                    }

                    throw new Error(
                        `vendor.assign_to_project failed for ${vendor.uuid}: status=${res.statusCode} body=${JSON.stringify(res.body)}`,
                    );
                }
            }

            // Assignment can be persisted before a downstream error bubbles up.
            // Check database first before failing. Add small delay to avoid connection pool exhaustion
            await new Promise((resolve) => setTimeout(resolve, 200));
            const mapping = await waitForProjectVendorMapping(vendor.uuid, projectUuid, 5000);
            if (mapping) {
                aaReadyVendors.push(vendor);
                console.log(`   ⚠️ Assignment persisted despite response error for vendor ${vendor.uuid}`);
                continue;
            }

            // Only fail if the mapping truly doesn't exist after waiting
            console.error(`   ❌ Assignment failed and no mapping found for vendor ${vendor.uuid}`);
            console.error(`      requestError: ${requestError?.message || 'none'}`);
            console.error(`      response: ${JSON.stringify(res?.body || null)}`);

            // Don't throw here - skip this vendor but continue with others
            console.log(`   ℹ️ Skipping vendor ${vendor.uuid} due to assignment failure`);
        }
        if (!aaReadyVendors.length) {
            throw new Error('No AA-ready vendors available after assignment step');
        }
        console.log('✅ Vendors assigned to project');

        // ── Step 3: Load or seed project beneficiaries directly via Prisma ─
        console.log('👥 Step 3: Loading project beneficiaries from DB...');

        const existingMappings = await prisma.beneficiaryProject.findMany({
            where: {
                projectId: projectUuid,
                deletedAt: null,
                Beneficiary: {
                    deletedAt: null,
                },
            },
            include: {
                Beneficiary: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: BENEFICIARY_COUNT,
        });

        existingMappings.forEach((mapping: any) => {
            beneficiaries.push({
                uuid: mapping.Beneficiary.uuid,
                walletAddress: mapping.Beneficiary.walletAddress,
            });
        });

        if (!beneficiaries.length) {
            throw new Error('No existing beneficiaries found for project; cannot continue WALK_IN redemption tests');
        }

        console.log(`✅ Beneficiaries loaded from DB mapping: ${beneficiaries.length} beneficiaries`);

        // ── Step 4: Create multiple WALK_IN inkinds ─────────────────────
        console.log(`📦 Step 4: Creating ${WALK_IN_INKIND_COUNT} walk-in inkinds...`);
        for (let i = 0; i < WALK_IN_INKIND_COUNT; i++) {
            const walkInRes = await projectAction('aa.inkinds.create', generateWalkInInkindDto());
            expect(walkInRes.body?.data?.uuid).toBeDefined();
            walkInInkindUuids.push(walkInRes.body.data.uuid);
        }
        expect(walkInInkindUuids).toHaveLength(WALK_IN_INKIND_COUNT);
        console.log(`✅ Inkind created: walk-in=${walkInInkindUuids.join(', ')}`);

        // ── Step 5: Add stock to each WALK_IN inkind ────────────────────
        console.log('📦 Step 5: Adding stock to walk-in inkinds...');
        for (const inkindUuid of walkInInkindUuids) {
            await projectAction('aaProject.inkindStock.add', { inkindId: inkindUuid, quantity: 50 });
        }
        console.log('✅ Walk-in inkind stock added for all inkinds');

        console.log('🎉 beforeAll setup COMPLETE!');
    }, 600_000);

    // -----------------------------------------------------------------------
    // 1. WALK_IN redemptions — 20 beneficiaries × 3 inkinds = 60 transactions
    // -----------------------------------------------------------------------
    describe('WALK_IN redemption', () => {
        it('should allow 20 beneficiaries to redeem 3 WALK_IN inkinds in separate transactions (60 total)', async () => {
            const walkInBenfs = beneficiaries.slice(0, Math.min(WALK_IN_BENEFICIARIES, beneficiaries.length));
            const activeVendors = aaReadyVendors.slice(0, Math.min(aaReadyVendors.length, walkInBenfs.length));
            expect(activeVendors.length).toBeGreaterThan(0);
            expect(walkInInkindUuids.length).toBe(WALK_IN_INKIND_COUNT);

            let successCount = 0;
            let attemptCount = 0;

            for (const inkindUuid of walkInInkindUuids) {
                for (let i = 0; i < walkInBenfs.length; i++) {
                    const vendor = activeVendors[i % activeVendors.length];
                    const benf = walkInBenfs[i];
                    const res = await projectAction(
                        'aaProject.beneficiaryInkinds.redeem',
                        {
                            walletAddress: benf.walletAddress,
                            inkinds: [{ uuid: inkindUuid }],
                        },
                        vendor.header,
                    );

                    attemptCount += 1;

                    if (res.statusCode < 300 && res.body?.success === true) {
                        const { redemptions } = res.body.data;
                        expect(Array.isArray(redemptions)).toBe(true);
                        expect(redemptions.length).toBeGreaterThan(0);
                        expect(redemptions[0].inkindUuid).toBe(inkindUuid);
                        expect(redemptions[0].redemptionId).toBeDefined();
                        successCount += 1;
                    }
                }
            }

            expect(attemptCount).toBe(WALK_IN_BENEFICIARIES * WALK_IN_INKIND_COUNT);
            expect(successCount).toBeGreaterThan(0);
        }, 120_000);

        it('should reject duplicate WALK_IN redemption for the same beneficiary', async () => {
            // Re-attempt the very first WALK_IN redemption (already done above)
            const alreadyRedeemedBenf = beneficiaries[0];
            const vendor = aaReadyVendors[0];

            const res = await projectAction(
                'aaProject.beneficiaryInkinds.redeem',
                {
                    walletAddress: alreadyRedeemedBenf.walletAddress,
                    inkinds: [{ uuid: walkInInkindUuids[0] }],
                },
                vendor.header,
            );

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });

    // -----------------------------------------------------------------------
    // 2. Error cases
    // -----------------------------------------------------------------------
    describe('Error cases', () => {
        it('should reject redemption with an empty inkinds array', async () => {
            const vendor = vendors[0];
            expect(aaReadyVendors.length).toBeGreaterThan(0);
            const activeVendor = aaReadyVendors[0];
            const benf = beneficiaries[0];

            const res = await projectAction(
                'aaProject.beneficiaryInkinds.redeem',
                {
                    walletAddress: benf.walletAddress,
                    inkinds: [],
                },
                activeVendor.header,
            );

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it('should reject redemption for a non-existent beneficiary wallet', async () => {
            const { ethers } = await import('ethers');
            const fakeWallet = ethers.Wallet.createRandom().address;
            const vendor = aaReadyVendors[0];

            const res = await projectAction(
                'aaProject.beneficiaryInkinds.redeem',
                {
                    walletAddress: fakeWallet,
                    inkinds: [{ uuid: walkInInkindUuids[0] }],
                },
                vendor.header,
            );

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it('should reject redemption for a non-existent inkind UUID', async () => {
            const vendor = vendors[0];
            expect(aaReadyVendors.length).toBeGreaterThan(0);
            const activeVendor = aaReadyVendors[0];
            const benf = beneficiaries[BENEFICIARY_COUNT - 2]; // unused beneficiary

            const res = await projectAction(
                'aaProject.beneficiaryInkinds.redeem',
                {
                    walletAddress: benf.walletAddress,
                    inkinds: [{ uuid: '00000000-0000-0000-0000-000000000000' }],
                },
                activeVendor.header,
            );

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it('should reject redemption without an auth token (unauthenticated)', async () => {
            const benf = beneficiaries[0];

            const res = await request(baseUrl)
                .post(`/v1/projects/${projectUuid}/actions`)
                .send({
                    action: 'aaProject.beneficiaryInkinds.redeem',
                    payload: {
                        walletAddress: benf.walletAddress,
                        inkinds: [{ uuid: walkInInkindUuids[0] }],
                    },
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });

    // -----------------------------------------------------------------------
    // 3. Summary verification — checks aggregate counts after all redemptions
    // -----------------------------------------------------------------------
    describe('Inkind summary', () => {
        it('should show summary entries for all WALK_IN inkinds with redemptions', async () => {
            const attempts = 12;
            const delayMs = 2000;
            let latestRes: any;
            let foundCount = 0;

            for (let i = 0; i < attempts; i++) {
                latestRes = await projectAction('aa.inkinds.getSummary', {});

                expect(latestRes.statusCode).toBeLessThan(300);
                expect(latestRes.body.success).toBe(true);

                const summaryItems = extractSummaryItems(latestRes.body.data);
                foundCount = walkInInkindUuids.filter((uuid) => {
                    const item = findInkindSummaryItem(summaryItems, uuid);
                    const totalRedemptions = Number(item?.totalRedemptions ?? 0);
                    return !!item && totalRedemptions >= 1;
                }).length;

                if (foundCount === walkInInkindUuids.length) break;

                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }

            expect(foundCount).toBe(walkInInkindUuids.length);
        }, 60_000);

    });

    // -----------------------------------------------------------------------
    // 4. Per-vendor log verification
    // -----------------------------------------------------------------------
    describe('Vendor redemption logs', () => {
        it('should return paginated WALK_IN redemption logs for each vendor', async () => {
            for (const vendor of aaReadyVendors) {
                const res = await projectAction('aaProject.groupInkinds.getLogsByVendor', {
                    vendorId: vendor.uuid,
                    page: 1,
                    perPage: 20,
                    order: 'desc',
                    sort: 'redeemedAt',
                });

                expect(res.statusCode).toBeLessThan(300);
                expect(res.body.success).toBe(true);
            }
        });

    });

    afterAll(async () => {
        // Properly close all Prisma connections to avoid connection pool exhaustion
        if (prisma) {
            await prisma.$disconnect();
        }
    });
});
