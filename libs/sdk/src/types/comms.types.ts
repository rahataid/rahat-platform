import { FormattedResponse } from '@rumsan/sdk/utils';
import { AxiosRequestConfig } from 'axios';
import { DateRangeQuery, ReportQuery } from '../comms/comms.types';

export type CommsClient = {
  listTransports: (
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;
  getUsage: (
    query?: DateRangeQuery,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;
  getUsageByXref: (
    xref: string,
    query?: DateRangeQuery,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;
  getCredits: (
    query?: DateRangeQuery,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;
  getCreditsByXref: (
    xref: string,
    query?: DateRangeQuery,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;
  getReport: (
    query?: ReportQuery,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;
};
