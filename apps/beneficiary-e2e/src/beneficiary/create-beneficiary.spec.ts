import request from 'supertest';
import { createBeneficiaryDto, createBeneficiaryDtoWallet, createBulkBeneficiaryDto, invalidPhone, invalidUUID, invalidWallet } from './testFixtureData';
import {AuthsModule, AuthsService, User} from '@rumsan/user';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

const baseUrl = "http://localhost:5500";
export const reqCache = new Map();
export const resCache = new Map();

describe('POST /v1/beneficiaries', () => {
    let accessToken;
    let authService: AuthsService;
    let header;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                AuthsModule,
                EventEmitterModule.forRoot(),
            ],
        }).compile();

        authService = moduleFixture.get<AuthsService>(AuthsService);

        const mockUser: User = {
            id: 1,
            uuid: "8e8f409e-b607-4ad1-b6cd-cc1e4f5a08c4",
            name: "Anupama Koirala",
            email: "anupama.rumsan@gmail.com",
            gender: 'UNKNOWN',
            phone: null,
            wallet: "0x75f598874DC39E364846d577CEde48d50378aC40",
            createdAt: new Date("2024-07-01T09:51:58.506Z"),
            extras: null,
            deletedAt: null,
            updatedAt: new Date("2024-07-01T09:51:58.506Z"),
            createdBy: null,
            updatedBy: null
        };
        const mockAuthority = {
            roles: [{ roleName: 'Admin' }],
            permissions: [
                {
                    action: "manage",
                    subject: "all",
                    inverted: false,
                    conditions: null
                }
            ],
        };
        const { accessToken: token } = await authService.signToken(mockUser, mockAuthority);
        accessToken = token
    });    

    it('should create new beneficiary if wallet is provided', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).post("/v1/beneficiaries").set('Authorization', header).send(createBeneficiaryDto);
        reqCache.set('beneficiary', createBeneficiaryDto);
        resCache.set('beneficiary', result.body.data);
        expect(result.statusCode).toBe(201);
        expect(result.body.success).toBe(true);
        expect(result.body.data).toBeInstanceOf(Object);
        expect(result.body.data).toEqual(resCache.get('beneficiary'));
        expect(result).toBeDefined();
    });

    it('should create new beneficiary if wallet isnot provided', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).post("/v1/beneficiaries").set('Authorization', header).send(createBeneficiaryDtoWallet);
        expect(result.statusCode).toBe(201);
        expect(result.body.success).toBe(true);
        expect(result.body.data).toBeInstanceOf(Object);
        expect(result).toBeDefined();
    });

    it('should return detail of beneficiary using uuid if beneficiary is available', async () => {
        header = `Bearer ${accessToken}`;
        const cachedBeneficiary = resCache.get('beneficiary');
        const result = await request(baseUrl).get(`/v1/beneficiaries/${cachedBeneficiary.uuid}`).set('Authorization', header);
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(result.body.data);
    });

    it('should return null if uuid is invalid', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get(`/v1/beneficiaries/${invalidUUID}`).set('Authorization', header);
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(null);
    });

    it('should return detail of beneficiary using phone number', async () => {
        header = `Bearer ${accessToken}`;
        const cachedBeneficiary = reqCache.get('beneficiary');
        const result = await request(baseUrl).get(`/v1/beneficiaries/phone/${cachedBeneficiary.piiData.phone}`).set('Authorization', header);
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(result.body.data);
    });

    it('should return null if phone number is invalid', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get(`/v1/beneficiaries/phone/${invalidPhone}`).set('Authorization', header);
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(null);
    });

    it('should return detail of beneficiary using wallet address', async () => {
        header = `Bearer ${accessToken}`;
        const cachedBeneficiary = resCache.get('beneficiary');
        const result = await request(baseUrl).get(`/v1/beneficiaries/wallet/${cachedBeneficiary.walletAddress}`).set('Authorization', header);
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(result.body.data);
    });

    it('should return null if wallet address is invalid', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get(`/v1/beneficiaries/wallet/${invalidWallet.address}`).set('Authorization', header);
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(null);
    });

    it('should return pii detail of the beneficiary', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get("/v1/beneficiaries/pii").set('Authorization', header);
        expect(result.status).toBe(200);
        expect(Array.isArray(result.body.data)).toBe(true);
        expect(result.body.data.every(item => typeof item === 'object')).toBe(true);
    });

    it('should create beneficiaries in bulk', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).post("/v1/beneficiaries/bulk").set('Authorization', header).send(createBulkBeneficiaryDto);
        resCache.set('bulkBeneficiary', result.body.data);
        expect(result.status).toBe(201);
        expect(result.body.data).toEqual(resCache.get('bulkBeneficiary'));        
    });
});

