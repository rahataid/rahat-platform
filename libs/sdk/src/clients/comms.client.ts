import { formatResponse } from '@rumsan/sdk/utils';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { DateRangeQuery, ReportQuery } from '../comms/comms.types';
import { CommsClient } from '../types/comms.types';

export const getCommsClient = (client: AxiosInstance): CommsClient => {
  return {
    listTransports: async (config?: AxiosRequestConfig) => {
      const response = await client.get('/comms/transports', config);
      return formatResponse<any>(response);
    },

    getUsage: async (query?: DateRangeQuery, config?: AxiosRequestConfig) => {
      const response = await client.get('/comms/usage', {
        params: query,
        ...config,
      });
      return formatResponse<any>(response);
    },

    getUsageByXref: async (
      xref: string,
      query?: DateRangeQuery,
      config?: AxiosRequestConfig
    ) => {
      const response = await client.get(`/comms/usage/xref/${xref}`, {
        params: query,
        ...config,
      });
      return formatResponse<any>(response);
    },

    getCredits: async (
      query?: DateRangeQuery,
      config?: AxiosRequestConfig
    ) => {
      const response = await client.get('/comms/credits', {
        params: query,
        ...config,
      });
      return formatResponse<any>(response);
    },

    getCreditsByXref: async (
      xref: string,
      query?: DateRangeQuery,
      config?: AxiosRequestConfig
    ) => {
      const response = await client.get(`/comms/credits/xref/${xref}`, {
        params: query,
        ...config,
      });
      return formatResponse<any>(response);
    },

    getReport: async (query?: ReportQuery, config?: AxiosRequestConfig) => {
      const response = await client.get('/comms/report', {
        params: query,
        ...config,
      });
      return formatResponse<any>(response);
    },
  };
};
