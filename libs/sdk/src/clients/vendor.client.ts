import { formatResponse } from '@rumsan/sdk/utils';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { VendorClient } from '../types/vendor.typs';
import { Vendor } from '../vendor';

export const getVendorClient = (client: AxiosInstance): VendorClient => {
  return {
    signup: async (data: Vendor, config?: AxiosRequestConfig) => {
      const response = await client.post('/users/vendors', data, config);
      return formatResponse<Vendor>(response);
    },
  };
};
