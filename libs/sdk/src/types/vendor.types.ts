import { Pagination } from '@rumsan/sdk/types';
import { FormattedResponse } from '@rumsan/sdk/utils';
import { AxiosRequestConfig } from 'axios';
import { Vendor } from '../vendor/vendors.types';

export type VendorClient = {
  signup: (
    data: Vendor,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Vendor>>;
  list:(
    data:Pagination,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Vendor[]>>;
};
