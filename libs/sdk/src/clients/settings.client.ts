import { Pagination, Setting } from '@rumsan/sdk/types';
import { formatResponse } from '@rumsan/sdk/utils';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  SettingList,
  SettingResponse
} from '../settings/settings.types';
import { SettingClient } from '../types/settings.clients.types';

export const getSettingsClient = (client: AxiosInstance): SettingClient => {
  return {
    create: async (data: Setting, config?: AxiosRequestConfig) => {
      const response = await client.post('/settings', data, config);
      return formatResponse<SettingResponse>(response);
    },
    listSettings: async (data?: Pagination, config?: AxiosRequestConfig) => {
      const response = await client.get('/settings', {
        params: data,
        ...config,
      });
      return formatResponse<SettingList>(response);
    },

    update: async (data: Setting, config?: AxiosRequestConfig) => {
      const response = await client.patch(
        `/settings/${data?.name}`,
        data,
        config,
      );
      return formatResponse<SettingResponse>(response);
    },

    getByName: async (name: string, config?: AxiosRequestConfig) => {
      const response = await client.get(`/settings/${name}`, config);
      return formatResponse<SettingResponse>(response);
    },
  };
};
