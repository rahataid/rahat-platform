import axios from 'axios';
import { TAuthApp } from '../app';
import { AppClient } from '../types/app.types';
import { getAppClient } from './app.client';
import { Pagination } from '@rumsan/sdk/types';

jest.mock('axios');

const mockAxiosInstance = axios as jest.Mocked<typeof axios>;

describe('AppClient', () => {
    const client: AppClient = getAppClient(mockAxiosInstance);

    describe('createAuthApp', () => {
        it('should create new auth app', async () => {
            const mockRequest: TAuthApp = {
                name: "Community Tool",
                address: "0x00",
                description: "This is app desc",
                nonceMessage: "HelloWorld",
                createdBy: "0x00"
            };

            const mockResponse = {
                success: true,
                data: {
                    id: 1,
                    uuid: 'uuid',
                    address: "0x00",
                    name: "Community Tool",
                    description: "This is app desc",
                    nonceMessage: "HelloWorld",
                    createdBy: "abc",
                    createdAt: "2024-09-12T04:57:05.255Z",
                    updatedAt: "2024-09-12T04:57:05.255Z",
                    deletedAt: null
                }
            };
            mockAxiosInstance.post.mockResolvedValue(mockResponse);
            const result = await client.createAuthApp(mockRequest);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/app/auth-apps`, mockRequest, undefined);
            expect(result.httpReponse).toEqual(mockResponse);
        });
    });

    describe('updateAuthApp', () => {
        it('should update the auth app as per uuid', async () => {
            const mockRequest: TAuthApp = {
                name: "Updated Name",
                description: "Updated Description",
                nonceMessage: "Ipdated NonceMessage"
            };

            const mockResponse = {
                success: true,
                data: {
                    id: 1,
                    uuid: '88846157-77b2-4cd9-9d72-08359526a46f',
                    address: "0x00",
                    name: "Updated Name",
                    description: "Updated Description",
                    nonceMessage: "Updated NonceMessage",
                    createdBy: "abc",
                    createdAt: "2024-09-12T04:57:05.255Z",
                    updatedAt: "2024-09-12T05:17:10.302Z",
                    deletedAt: null
                }
            };
            const mockDto = {
                uuid: 'uuid' as`${string}-${string}-${string}-${string}-${string}`,
                data: mockRequest
            }
            mockAxiosInstance.put.mockResolvedValue(mockResponse);
            const result = await client.updateAuthApp(mockDto);
            expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/app/auth-apps/${mockDto.uuid}`, mockRequest, undefined);
            expect(result.httpReponse).toEqual(mockResponse);
        });
    });

    describe('listAuthApps', () => {
        it('should list all the auth apps', async () => {
            const queryParams: Pagination = {
                page: 1,
                perPage: 10,
                sort: 'createdAt',
                order: 'asc'
            };
            const mockResponse = {
                success: true,
                data: [
                    {
                        id: 1,
                        uuid: 'uuid' as `${string}-${string}-${string}-${string}-${string}`,
                        address: "0x00",
                        name: "Updated Name",
                        description: "Updated Description",
                        nonceMessage: "Updated NonceMessage",
                        createdBy: "abc",
                        createdAt: "2024-09-12T04:57:05.255Z",
                        updatedAt: "2024-09-12T05:17:10.302Z",
                        deletedAt: null
                    }
                ],
                meta: {
                    total: 1,
                    lastPage: 1,
                    currentPage: 1,
                    perPage: 10,
                    prev: null,
                    next: null
                }
            };
            mockAxiosInstance.get.mockResolvedValue(mockResponse);
            const result = await client.listAuthApps(queryParams);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/app/auth-apps`, {
                params: queryParams, undefined
            });
            expect(result.httpReponse).toEqual(mockResponse);
        });
    });

    describe('getAuthApp', () => {
        it('should return the details of auth app as per uuid', async () => {
            const mockResponse = {
                success: true,
                data: {
                    id: 1,
                    uuid: 'uuid' as `${string}-${string}-${string}-${string}-${string}`,
                    address: "0x00",
                    name: "Updated Name",
                    description: "Updated Description",
                    nonceMessage: "Updated NonceMessage",
                    createdBy: "abc",
                    createdAt: "2024-09-12T04:57:05.255Z",
                    updatedAt: "2024-09-12T05:17:10.302Z",
                    deletedAt: null
                }
            };
            mockAxiosInstance.get.mockResolvedValue(mockResponse);
            const result = await client.getAuthApp(mockResponse.data.uuid);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/app/auth-apps/${mockResponse.data.uuid}`, undefined);
            expect(result.httpReponse).toEqual(mockResponse);
        });
    });

    describe('softDeleteAuthApp', () => {
        it('should soft delete an auth app as per uuid', async () => {
            const mockResponse = {
                success: true,
                data: {
                    id: 1,
                    uuid: 'uuid' as `${string}-${string}-${string}-${string}-${string}`,
                    address: "0x00",
                    name: "Updated Name",
                    description: "Updated Description",
                    nonceMessage: "Updated NonceMessage",
                    createdBy: "abc",
                    createdAt: "2024-09-12T04:57:05.255Z",
                    updatedAt: "2024-09-12T05:17:10.302Z",
                    deletedAt: "2024-09-12T06:11:33.812Z"
                }
            };
            mockAxiosInstance.delete.mockResolvedValue(mockResponse);
            const result = await client.softDeleteAuthApp(mockResponse.data.uuid);
            expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/app/auth-apps/${mockResponse.data.uuid}`, undefined);
            expect(result.httpReponse).toEqual(mockResponse);
        });
    });
});