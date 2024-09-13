import axios from 'axios';
import { Pagination, Setting } from '@rumsan/sdk/types';
import { SettingClient } from '../../types/settings.clients.types';
import { SettingList } from '../../settings/settings.types';
import { getSettingsClient } from '../../clients/settings.client';

jest.mock('axios');

const mockAxiosInstance = axios as jest.Mocked<typeof axios>;

const settingsUrl = {
    create: '/settings',
    get: '/settings',
    update: (settingName: string) => `/settings/${settingName}`,
    getByName: (settingName: string) => `/settings/${settingName}`
};

settingsUrl.update("lishu")

describe('SettingsClient', () => {
    const client:SettingClient = getSettingsClient(mockAxiosInstance);

    describe('create', () => {
        it('should create settings with necessary details', async () => {
            const mockRequest: Setting = {
                name: "TEST",
                value: {
                    host: "test.gmail.com",
                    Port: 111,
                    secure: true,
                    username: "test",
                    password: "test"
                },
                requiredFields: [
                    "host",
                    "port",
                    "secure",
                    "username",
                    "PASSWORD"
                ],
                isReadOnly: false,
                isPrivate: true
            };

            const mockResponse: SettingList = {
                sucess: true,
                data: mockRequest
            };
            mockAxiosInstance.post.mockResolvedValue(mockResponse);
            const result = await client.create(mockRequest);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith(settingsUrl.create, mockRequest, undefined);
            expect(result.httpReponse).toEqual(mockResponse);
        });
    });

    describe('listSettings', () => {
        it('should return list of settings', async () => {
            const queryParams:Pagination = {
                sort: 'createdAt',
                order: 'asc',
                page: 1,
                perPage: 10
            };

            const mockResponse = {
                success: true,
                data: [
                    {
                        name: "TEST_ABC",
                        dataType: "STRING",
                        isPrivate: true,
                        isReadOnly: false,
                        requiredFields: [
                            "HOST",
                            "PORT",
                            "SECURE",
                            "USERNAME",
                            "PASSWORD"
                        ],
                        value: {
                            host: "test_abc.gmail.com",
                            Port: 111,
                            secure: true,
                            username: "test",
                            password: "test"
                        }
                    },
                    {
                        name: "TEST",
                        dataType: "STRING",
                        isPrivate: true,
                        isReadOnly: false,
                        requiredFields: [
                            "HOST",
                            "PORT",
                            "SECURE",
                            "USERNAME",
                            "PASSWORD"
                        ],
                        value: {
                            host: "test.gmail.com",
                            Port: 111,
                            secure: true,
                            username: "test",
                            password: "test"
                        }
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
            const result = await client.listSettings(queryParams);
            console.log(result, 'result');
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(settingsUrl.get, { params: queryParams, undefined });
            expect(result.httpReponse).toEqual(mockResponse);
        });
    });

    describe('update', () => {
        it('should update the settings detail as per uuid', async () => {
            const mockRequest = {
                name: "SMTPS",
                value: {
                    username: "xyz",
                    password: "12345"
                },
                requiredFields: [
                    "username",
                    "password"
                ],
                isPrivate: false,
                isReadOnly: true
            };

            const mockResponse = {
                sucess: true,
                data: {
                    name: "SMTPS",
                    value: {
                        password: "12345",
                        username: "xyz"
                    },
                    dataType: "OBJECT",
                    requiredFields: [
                        "username",
                        "password"
                    ],
                    isReadOnly: true,
                    isPrivate: false
                }
            };
            mockAxiosInstance.patch.mockResolvedValue(mockResponse);
            const result = await client.update(mockRequest);
            expect(mockAxiosInstance.patch).toHaveBeenCalledWith(settingsUrl.update(mockRequest.name), mockRequest, undefined);
            expect(result.httpReponse).toEqual(mockResponse);
        });
    });

    describe('getByName', () => {
        it('should return seting as per name', async () => {
            const mockResponse = {
                success: true,
                data: {
                    name: "SMTPS",
                    dataType: "OBJECT",
                    isPrivate: false,
                    isReadOnly: true,
                    requiredFields: [
                        "username",
                        "password"
                    ],
                    value: {
                        password: "12345",
                        username: "xyz"
                    }
                }
            };
            mockAxiosInstance.get.mockResolvedValue(mockResponse);
            const result = await client.getByName(mockResponse.data.name);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(settingsUrl.getByName(mockResponse.data.name), undefined);
            expect(result.httpReponse).toEqual(mockResponse);
        });
    });
});
