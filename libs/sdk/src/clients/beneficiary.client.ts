import { Pagination } from '@rumsan/sdk/types';
import { formatResponse } from '@rumsan/sdk/utils';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';
import { Beneficiary, TPIIData } from '../beneficiary';
import { BeneficiaryClient, Stats } from '../types';

export const getBeneficiaryClient = (
  client: AxiosInstance
): BeneficiaryClient => {
  return {
    create: async (data: Beneficiary, config?: AxiosRequestConfig) => {
      const response = await client.post('/beneficiaries', data, config);
      return formatResponse<Beneficiary>(response);
    },

    createBulk: async (data: Beneficiary[], config?: AxiosRequestConfig) => {
      const response = await client.post('/beneficiaries/bulk', data, config);
      return formatResponse<any>(response);
    },

    getStats: async (config?: AxiosRequestConfig) => {
      const response = await client.get('/beneficiaries/stats', config);
      return formatResponse<Stats[]>(response);
    },

    list: async (data?: Pagination, config?: AxiosRequestConfig) => {
      const response = await client.get('/beneficiaries', {
        params: data,
        ...config,
      });
      return formatResponse<Beneficiary[]>(response);
    },

    listPiiData: async (data?: Pagination, config?: AxiosRequestConfig) => {
      const response = await client.get('/beneficiaries/pii', {
        params: data,
        ...config,
      });
      return formatResponse<TPIIData[]>(response);
    },

    update: async (
      { uuid, data }: { uuid: UUID; data: Beneficiary },
      config?: AxiosRequestConfig
    ) => {
      const response = await client.put(`/beneficiaries/${uuid}`, data, config);
      return formatResponse<Beneficiary>(response);
    },

    get: async (uuid: UUID, config?: AxiosRequestConfig) => {
      const response = await client.get(`/beneficiaries/${uuid}`, config);
      return formatResponse<Beneficiary>(response);
    },

    generateVerificationLink: async (
      uuid: UUID,
      config?: AxiosRequestConfig
    ) => {
      const response = await client.get(
        `/beneficiaries/verification-link/${uuid}`,
        config
      );
      return formatResponse<string>(response);
    },
    upload: async (formData: FormData, config?: AxiosRequestConfig) => {
      const response = await client.post(
        '/beneficiaries/upload',
        formData,
        config
      );
      return formatResponse<any>(response);
    },

    getByPhone: async (phone: string, config?: AxiosRequestConfig) => {
      const response = await client.get(
        `/beneficiaries/phone/${phone}`,
        config
      );
      return formatResponse<Beneficiary>(response);
    },
  };
};
