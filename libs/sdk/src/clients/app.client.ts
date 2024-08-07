import { Pagination } from '@rumsan/sdk/types';
import { formatResponse } from '@rumsan/sdk/utils';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';
import { TAuthApp } from '../app';
import { AppClient } from '../types/app.types';

export const getAppClient = (client: AxiosInstance): AppClient => {
    return {
        createAuthApp: async (data: TAuthApp, config?: AxiosRequestConfig) => {
            const response = await client.post('/app/auth-apps', data, config);
            return formatResponse<TAuthApp>(response);
        },
        updateAuthApp: async (
            { uuid, data }: { uuid: UUID; data: TAuthApp },
            config?: AxiosRequestConfig
        ) => {
            const response = await client.put(`/app/auth-apps/${uuid}`, data, config);
            return formatResponse<TAuthApp>(response);
        },
        listAuthApps: async (data: Pagination, config?: AxiosRequestConfig) => {
            const response = await client.get('/app/auth-apps', {
                params: data,
                ...config
            });
            return formatResponse<TAuthApp[]>(response)
        },
        getAuthApp: async (uuid: UUID, config?: AxiosRequestConfig) => {
            const response = await client.get(`/app/auth-apps/${uuid}`, config);
            return formatResponse<TAuthApp>(response)
        },
        softDeleteAuthApp: async (uuid: UUID, config?: AxiosRequestConfig) => {
            const response = await client.delete(`/app/auth-apps/${uuid}`, config);
            return formatResponse<TAuthApp>(response)
        }
    };
};
