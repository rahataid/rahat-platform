import { Pagination } from '@rumsan/sdk/types';
import { formatResponse } from '@rumsan/sdk/utils';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';
import { VendorClient } from '../types/vendor.types';
import { Vendor } from '../vendor';

export const getVendorClient = (client: AxiosInstance): VendorClient => {
  return {
    signup: async (data: Vendor, config?: AxiosRequestConfig) => {
      const response = await client.post('/users/vendors', data, config);
      return formatResponse<Vendor>(response);
    },
    
    list:async(data:Pagination,config?: AxiosRequestConfig) => {
      const response = await client.get('/users/vendors',{
        params:data,
        ...config
      });
      return formatResponse<Vendor[]>(response)
    },

    get: async(uuid:UUID,config?: AxiosRequestConfig) =>{
      const response = await client.get(`/users/vendors/${uuid}`,config);
      return formatResponse<Vendor>(response)
    }
  };
};
