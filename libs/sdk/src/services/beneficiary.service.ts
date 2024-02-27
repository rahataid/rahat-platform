import { AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';
import {
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '../dtos';
import { TBeneficiary } from '../types';
import { TStats } from '../types/response.types';
import RahatClient, { formatResponse } from './rahat.client';

export const Beneficiary = {
  create: async (data: CreateBeneficiaryDto, config?: AxiosRequestConfig) => {
    const response = await RahatClient.instance.post(
      '/beneficiaries',
      data,
      config
    );
    return formatResponse<TBeneficiary>(response);
  },

  createBulk: async (
    data: CreateBeneficiaryDto[],
    config?: AxiosRequestConfig
  ) => {
    return RahatClient.instance.post('/beneficiaries/bulk', data, config);
  },

  getStats: async (config?: AxiosRequestConfig) => {
    const response = await RahatClient.instance.get(
      '/beneficiaries/stats',
      config
    );
    return formatResponse<TStats[]>(response);
  },

  list: async (data: ListBeneficiaryDto, config?: AxiosRequestConfig) => {
    const response = await RahatClient.instance.get('/beneficiaries', {
      params: data,
      ...config,
    });
    return formatResponse<TBeneficiary[]>(response);
  },

  update: async (
    uuid: UUID,
    data: UpdateBeneficiaryDto,
    config?: AxiosRequestConfig
  ) => {
    return RahatClient.instance.put(`/beneficiaries/${uuid}`, data, config);
  },
};
