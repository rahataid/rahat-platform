import { formatResponse } from '@rumsan/sdk/utils';
import { AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';
import { RahatClient } from '../rahat.client';
import { Beneficiary as TBeneficiary } from '../types';
import { TStats } from '../types/response.types';

export const Beneficiary = {
  create: async (data: TBeneficiary, config?: AxiosRequestConfig) => {
    const response = await RahatClient.getAxiosInstance.post(
      '/beneficiaries',
      data,
      config
    );
    return formatResponse<TBeneficiary>(response);
  },

  createBulk: async (data: TBeneficiary[], config?: AxiosRequestConfig) => {
    return RahatClient.getAxiosInstance.post(
      '/beneficiaries/bulk',
      data,
      config
    );
  },

  getStats: async (config?: AxiosRequestConfig) => {
    const response = await RahatClient.getAxiosInstance.get(
      '/beneficiaries/stats',
      config
    );
    return formatResponse<TStats[]>(response);
  },

  list: async (data: TBeneficiary, config?: AxiosRequestConfig) => {
    const response = await RahatClient.getAxiosInstance.get('/beneficiaries', {
      params: data,
      ...config,
    });
    return formatResponse<TBeneficiary[]>(response);
  },

  update: async (
    { uuid, data }: { uuid: UUID; data: TBeneficiary },
    config?: AxiosRequestConfig
  ) => {
    return RahatClient.getAxiosInstance.put(
      `/beneficiaries/${uuid}`,
      data,
      config
    );
  },
};
