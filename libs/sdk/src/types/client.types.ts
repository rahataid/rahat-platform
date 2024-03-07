import { Pagination } from '@rumsan/sdk/types';
import { FormattedResponse } from '@rumsan/sdk/utils';
import { AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';
import { Beneficiary } from '../beneficiary/beneficiary.types';
import { Stats } from './response.types';

export type BeneficiaryClient = {
  create: (
    data: Beneficiary,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary>>;
  createBulk: (
    data: Beneficiary[],
    config?: AxiosRequestConfig
  ) => Promise<any>;
  getStats: (
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Stats[]>>;
  list: (
    data?: Pagination,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary[]>>;
  listPiiData: (
    data?: Pagination,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary[]>>;
  update: (
    { uuid, data }: { uuid: UUID; data: Beneficiary },
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary>>;

  get: (
    uuid: UUID,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary>>;
};
