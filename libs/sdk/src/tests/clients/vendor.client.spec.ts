import { VendorClient } from '../../types/vendor.types';
import { getVendorClient } from '../../clients/vendor.client';
import { Vendor } from '../../vendor';
import { Service } from "@rumsan/sdk/enums";
import { Pagination } from "@rumsan/sdk/types";
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { formatResponse } from '@rumsan/sdk/utils';

const mockAxios: jest.Mocked<AxiosInstance> = {
    post: jest.fn(),
    get: jest.fn(),
} as any;
  
jest.mock('@rumsan/sdk/utils', () => ({
    formatResponse: jest.fn(),
}));

const vendorUrl = {
    signup:'/vendors',
    list: '/vendors',
    get: (uuid: string) => `/vendors/${uuid}`
};

describe('VendorClient', () => {
    const client:VendorClient = getVendorClient(mockAxios);

    describe('signup', () => {
        it('should create new vendor with correct data, config and formatted response', async () => {
            const mockRequest:Vendor = {
                id: 1,
                uuid: "uuid",
                name: "John Doe",
                email: "john@mailinator.com",
                phone: "9843847838",
                location: 'ktm',
                wallet: "0x00",
                extras: {
                    isVendor: true
                },
                service: Service.EMAIL,
                createdAt: new Date ("2024-09-13T07:17:19.294Z"),
                updatedAt: new Date ("2024-09-13T07:17:19.294Z"),
                deletedAt: null,
            };
            const mockResponse = {
                success: true,
                data: {
                    id: 1,
                    uuid: 'uuid',
                    name: 'John Doe',
                    gender: 'UNKNOWN',
                    email: 'john@mailinator.com',
                    phone: '9898',
                    wallet: '0x00',
                    extras: { isVendor: true },
                    createdAt: '2024-09-13T07:17:19.294Z',
                    updatedAt: '2024-09-13T07:17:19.294Z',
                    deletedAt: null,
                    createdBy: null,
                    updatedBy: null
                }
            };
            const mockConfig:AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' }};
            mockAxios.post.mockResolvedValue(mockResponse);
            (formatResponse as jest.Mock).mockReturnValueOnce(mockResponse);
            const result = await client.signup(mockRequest, mockConfig);
            expect(mockAxios.post).toHaveBeenCalledWith(vendorUrl.signup, mockRequest, mockConfig);
            expect(formatResponse).toHaveBeenCalledWith(mockResponse);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('list', () => {
        it('should list all the vendors', async () => {
            const queryParams: Pagination = {
                page: 1,
                perPage: 10,
                sort: 'createdAt',
                order: 'asc'
            };
            const mockResponse = [{
                id: 6,
                userId: 6,
                roleId: 4,
                expiry: null,
                createdAt: "2024-09-13T07:17:19.294Z",
                createdBy: null,
                User: {
                    id: 6,
                    uuid: "uuid",
                    name: "John Doe",
                    gender: "UNKNOWN",
                    email: "john@mailinator.com",
                    phone: "9898",
                    wallet: "0x00",
                    extras: {
                        isVendor: true
                    },
                    createdAt: "2024-09-13T07:17:19.294Z",
                    updatedAt: "2024-09-13T07:17:19.294Z",
                    deletedAt: null,
                    createdBy: null,
                    updatedBy: null,
                    VendorProject: []
                }
            }];  
            const mockConfig:AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' }, params: queryParams };
            mockAxios.get.mockResolvedValue( { data: mockResponse });
            (formatResponse as jest.Mock).mockReturnValueOnce(mockResponse);
            const result = await client.list(queryParams, mockConfig);
            expect(mockAxios.get).toHaveBeenCalledWith(vendorUrl.list, mockConfig );
            expect(formatResponse).toHaveBeenCalledWith({ data: mockResponse });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('get', () => {
        it('should return vendor details as per uuid', async () => {
            const mockResponse = {
                data: {
                    id: 6,
                    uuid: "uuid" as `${string}-${string}-${string}-${string}-${string}`,
                    name: "John Doe",
                    gender: "UNKNOWN",
                    email: "john@mailinator.com",
                    phone: "9898",
                    wallet: "0x00",
                    extras: {
                        isVendor: true
                    },
                    createdAt: "2024-09-13T07:17:19.294Z",
                    updatedAt: "2024-09-13T07:17:19.294Z",
                    deletedAt: null,
                    createdBy: null,
                    updatedBy: null,
                    projects: []
                }
            };
            const mockConfig:AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' } };
            mockAxios.get.mockResolvedValue(mockResponse);
            (formatResponse as jest.Mock).mockReturnValueOnce(mockResponse);
            const result = await client.get(mockResponse.data.uuid, mockConfig);
            expect(mockAxios.get).toHaveBeenCalledWith(vendorUrl.get(mockResponse.data.uuid), mockConfig);
            expect(formatResponse).toHaveBeenCalledWith(mockResponse);
            expect(result).toEqual(mockResponse);
        });
    });
});