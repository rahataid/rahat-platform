import { Pagination } from '@rumsan/sdk/types';
import { FormattedResponse, formatResponse } from '@rumsan/sdk/utils';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';

type ImportStatus = 'NEW' | 'PROCESSING' | 'IMPORTED' | 'FAILED';

export type ImportCreate = {
  fileUrl: string;
  groupName: string;
  groupUUID: string;
  beneficiaryCount: number;
  meta?: Record<string, unknown>;
};

export type Import = {
  uuid: string;
  r2Key: string;
  fileUrl: string;
  groupName: string;
  groupUUID: string;
  beneficiaryCount: number;
  source?: string;
  status: ImportStatus;
  extras?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ImportListQuery = Partial<Pagination> & {
  status?: ImportStatus;
  source?: string;
};

export type ImportsClient = {
  create: (
    data: ImportCreate,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Import>>;
  list: (
    data?: ImportListQuery,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Import[]>>;
  get: (
    uuid: UUID,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Import>>;
};

export const getImportsClient = (
  client: AxiosInstance
): ImportsClient => {
  return {
    create: async (data: ImportCreate, config?: AxiosRequestConfig) => {
      const response = await client.post('/imports', data, config);
      return formatResponse<Import>(response);
    },

    list: async (data?: ImportListQuery, config?: AxiosRequestConfig) => {
      const response = await client.get('/imports', {
        params: data,
        ...config,
      });
      return formatResponse<Import[]>(response);
    },

    get: async (uuid: UUID, config?: AxiosRequestConfig) => {
      const response = await client.get(`/imports/${uuid}`, config);
      return formatResponse<Import>(response);
    },
  };
};
