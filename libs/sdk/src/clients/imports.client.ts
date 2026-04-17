import { Pagination } from '@rumsan/sdk/types';
import { FormattedResponse, formatResponse } from '@rumsan/sdk/utils';
import { AxiosInstance, AxiosRequestConfig } from 'axios';

type ImportStatus = 'NEW' | 'PROCESSING' | 'IMPORTED' | 'FAILED' | 'REJECTED';

export type ImportCreate = {
  fileUrl: string;
  groupName: string;
  groupstring: string;
  beneficiaryCount: number;
  meta?: Record<string, unknown>;
};

export type Import = {
  uuid: string;
  r2Key: string;
  fileUrl: string;
  groupName: string;
  groupstring: string;
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
  sort?: string;
  order?: 'asc' | 'desc';
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
    uuid: string,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Import>>;
  getFile: (
    uuid: string,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Blob>>;
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

    get: async (uuid: string, config?: AxiosRequestConfig) => {
      const response = await client.get(`/imports/${uuid}`, config);
      return formatResponse<Import>(response);
    },

    getFile: async (uuid: string, config?: AxiosRequestConfig) => {
      const response = await client.get(`/imports/${uuid}/file`, {
        responseType: 'blob',
        ...config,
      });
      return formatResponse<Blob>(response);
    },
  };
};
