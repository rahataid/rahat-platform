import request from 'supertest';
import { AuthsModule, AuthsService, User } from '@rumsan/user';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { createProjectDto, queryParams, resProject } from './testFixtureProjectData';

const projectResCache = new Map();
const baseUrl = "http://localhost:5500";

describe('POST /v1/projects', () => {
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

    it('should create project details', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).post('/v1/projects').set('Authorization', header).send(createProjectDto);
        projectResCache.set('project', result.body.data);
        expect(result.status).toBe(201);
        expect(result.body.success).toBe(true);
        expect(result.body.data).toEqual(result.body.data);
    });

    it('should return the project details using uuid', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get(`/v1/projects/${resProject.uuid}`).set('Authorization', header);
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(resProject);
        expect(result).toBeDefined();
    });

    it('should return all the grouped beneficiaries', async () => {
        header = `Bearer ${accessToken}`;
        const result = await request(baseUrl).get('/v1/beneficiaries/groups/all').set('Authorization', header).query(queryParams);
        expect(result.status).toBe(200);
        expect(result.body.data).toEqual(result.body.data);
        expect(result.body.success).toBe(true);
    });
});

