import { Pagination } from '@rumsan/sdk/types';
import { getProjectClient } from '../../clients/project.client';
import { ProjectClient } from '../../types';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { formatResponse } from '@rumsan/sdk/utils';
import { ProjectStatus } from '@rahataid/sdk/enums';

const mockAxios: jest.Mocked<AxiosInstance> = {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
} as any;
  
jest.mock('@rumsan/sdk/utils', () => ({
    FormattedResponse: jest.fn(),
    formatResponse: jest.fn(),
}));

const projectUrl = {
    list: '/projects/',
    get: (uuid: string) => `/projects/${uuid}`
}

describe('ProjectClient', () => {
    const client:ProjectClient = getProjectClient(mockAxios);

    // describe('projectActions', () => {
    //     it('should create project actions', async () => {
    //         const mockUUID = 'uuid';
    //         const mockRequest ={
    //             action: "beneficiary.create",
    //             payload: {
    //                 name: "John Doe"
    //             }
    //         };
    //         mockAxios.post.mockResolvedValue(mockResponse);
    //     });
    // });

    describe('list', () => {
        it('should list all the projects with formatted response', async () => {
            const mockResponse = [
                {
                    id: 1,
                    uuid: "uuid",
                    name: "Test One",
                    description: "Description about test one",
                    status: "NOT_READY",
                    type: "el",
                    contractAddress: "0x123",
                    extras: {
                        test: "test"
                    },
                    createdAt: "2024-09-02T11:59:25.229Z",
                    updatedAt: "2024-09-02T11:59:25.229Z",
                    deletedAt: null
                },
                {
                    id: 2,
                    uuid: "uuid",
                    name: "Test Two",
                    description: "Description about test two",
                    status: "NOT_READY",
                    type: "el",
                    contractAddress: "0x123",
                    extras: {
                        test: "test"
                    },
                    createdAt: "2024-09-02T11:59:25.229Z",
                    updatedAt: "2024-09-02T11:59:25.229Z",
                    deletedAt: null
                }
            ];
            const mockConfig:AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' }};
            mockAxios.get.mockResolvedValue(mockResponse);
            (formatResponse as jest.Mock).mockReturnValueOnce(mockResponse);
            const result = await client.list(mockConfig);
            console.log(result, 'result');
            expect(mockAxios.get).toHaveBeenCalledWith(projectUrl.list, mockConfig);
            expect(formatResponse).toHaveBeenCalledWith(mockResponse);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('get', () => {
        it('should return project details as per uuid with formatted response', async () => {
            const mockResponse = {
                uuid: "uuid" as `${string}-${string}-${string}-${string}-${string}`,
                name: "abc",
                description: "Aestas textus praesentium aegrotatio. Defetiscor atque creptio antepono spectaculum cumque carus subiungo umbra. Conculco eligendi audentia aeger statua curatio.",
                status: ProjectStatus.NOT_READY,
                type: "el",
                contractAddress: "0xd",
                extras: {
                    test: "into"
                },
                createdAt: new Date("2024-09-11T05:50:54.486Z"),
                updatedAt: new Date("2024-09-11T05:51:00.147Z"),
                deletedAt: null
            };
            const mockConfig:AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' }};
            mockAxios.get.mockResolvedValue(mockResponse);
            (formatResponse as jest.Mock).mockReturnValueOnce(mockResponse);
            const result = await client.get(mockResponse.uuid, mockConfig);
            console.log(result, 'result');
            expect(mockAxios.get).toHaveBeenCalledWith(projectUrl.get(mockResponse.uuid), mockConfig);
            expect(formatResponse).toHaveBeenCalledWith(mockResponse);
            expect(result).toEqual(mockResponse);
        });
    });
});