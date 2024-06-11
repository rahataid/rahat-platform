import { Pagination } from '@rumsan/sdk/types';
import { FormattedResponse } from '@rumsan/sdk/utils';
import { AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';
import { Beneficiary, ImportTempBeneficiary, TPIIData, TempBeneficiary } from '../beneficiary/beneficiary.types';
import { Stats } from './response.types';

type OptionalPagination = Partial<Pagination>;
export type BeneficiaryClient = {
  create: (
    data: Beneficiary,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary>>;
  createBulk: (
    data: Beneficiary[],
    config?: AxiosRequestConfig
  ) => Promise<any>;
  importTempBeneficiaries: (
    data: ImportTempBeneficiary,
    config?: AxiosRequestConfig
  ) => Promise<any>;
  getStats: (
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Stats[]>>;
  listTempBeneficiary: (
    data?: Pagination,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<TempBeneficiary[]>>;
  listTempGroups: (
    data?: Pagination,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;
  list: (
    data?: Pagination,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary[]>>;
  listPiiData: (
    data?: OptionalPagination,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<TPIIData[]>>;
  update: (
    { uuid, data }: { uuid: UUID; data: Beneficiary },
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary>>;

  get: (
    uuid: UUID,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary>>;

  getByPhone: (
    phone: string,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Beneficiary>>;

  generateVerificationLink: (
    uuid: UUID,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<string>>;
  upload: (
    formData: FormData,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;
};
