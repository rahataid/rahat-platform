import request from 'supertest';
import {AuthsModule, AuthsService, User} from '@rumsan/user';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { createBeneficiaryDto, extraDto } from './testFixtureData';

const baseUrl = "http://localhost:5500";

describe('GET /v1/beneficiaries', () => {
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
    
    it('should return detail of beneficiary using uuid', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get(`/v1/beneficiaries/${extraDto.uuid}`).set('Authorization', header);
        console.log(result.body);
        expect(result.status).toBe(200);
        expect(result.body.data.uuid).toBe(extraDto.uuid);
        // expect(result.req.headers.Authorization).toBe(header);
    });

    it('should return detail of beneficiary using phone', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get(`/v1/beneficiaries/phone/${createBeneficiaryDto.piiData.phone}`).set('Authorization', header);
        console.log(result.body.data, 'data');
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(createBeneficiaryDto);
        expect(result.body.data.piiData.phone).toBe(createBeneficiaryDto.piiData.phone); 
    });

    it('should return detail of beneficiary using wallet address', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get(`/v1/beneficiaries/wallet/${createBeneficiaryDto.walletAddress}`).set('Authorization', header);
        console.log(result.body.data, 'data');
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(createBeneficiaryDto); 
        expect(result.body.data.walletAddress).toBe(createBeneficiaryDto.walletAddress);
    });

    it('should return pii detail of the beneficiary', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get("/v1/beneficiaries/pii").set('Authorization', header);
        expect(result.status).toBe(200);
        expect(Array.isArray(result.body.data)).toBe(true);
        expect(result.body.data.every(item => typeof item === 'object')).toBe(true);
    });
});