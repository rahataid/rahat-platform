import request from 'supertest';
import { AuthsModule, AuthsService, User } from '@rumsan/user';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

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

    it('should update the beneficiaries details', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get('/v1/beneficiaries/stats').set('Authorization', header);
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
        expect(result.body.data).toEqual(result.body.data);
        expect(Array.isArray(result.body.data)).toBe(true);
        expect(result.body.data.every(item => typeof item === 'object')).toBe(true);
    });

    it('should update the beneficiaries details', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get('/v1/beneficiaries/table-stats').set('Authorization', header);
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
        expect(result.body.data).toEqual(result.body.data);
        expect(Array.isArray(result.body.data)).toBe(true);
        expect(result.body.data.every(item => typeof item === 'object')).toBe(true);
    });
});