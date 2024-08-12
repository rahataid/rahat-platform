import { Pagination } from '@rumsan/sdk/types';
import { FormattedResponse } from '@rumsan/sdk/utils';
import { AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';
import { TAuthApp } from '../app';

export type AppClient = {
    createAuthApp: (
        data: TAuthApp,
        config?: AxiosRequestConfig
    ) => Promise<FormattedResponse<TAuthApp>>;
    updateAuthApp: (
        { uuid, data }: { uuid: UUID; data: TAuthApp },
        config?: AxiosRequestConfig
    ) => Promise<FormattedResponse<TAuthApp>>;
    listAuthApps: (
        data?: Pagination,
        config?: AxiosRequestConfig
    ) => Promise<FormattedResponse<TAuthApp[]>>;
    getAuthApp: (uuid: UUID, config?: AxiosRequestConfig
    ) => Promise<FormattedResponse<TAuthApp>>
    softDeleteAuthApp: (uuid: UUID, config?: AxiosRequestConfig
    ) => Promise<FormattedResponse<TAuthApp>>
};
