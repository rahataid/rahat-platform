
import { Pagination } from "@rumsan/sdk/types";
import { FormattedResponse, formatResponse } from "@rumsan/sdk/utils";
import { AxiosInstance, AxiosRequestConfig } from "axios";
import { UUID } from "crypto";
import { Grievance, GrievanceStatus } from "../grievance";


type OptionalPagination = Partial<Pagination>;


export type GrievanceClient = {
  create: (
    data: Grievance,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Grievance>>;
  list: (
    data?: OptionalPagination,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Grievance[]>>;
  changeStatus: (
    { uuid, data }: { uuid: UUID; data: GrievanceStatus },
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Grievance>>;
  delete: (
    uuid: UUID,
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Grievance>>;
};

export const getGrievanceClient = (
  client: AxiosInstance
): GrievanceClient => {
  return {
    create: async (data: Grievance, config?: AxiosRequestConfig) => {
      const response = await client.post('/grievances', data, config);
      return formatResponse<Grievance>(response);
    },

    list: async (data?: Pagination, config?: AxiosRequestConfig) => {
      const response = await client.get('/grievances', {
        params: data,
        ...config,
      });
      return formatResponse<Grievance[]>(response);
    },

    changeStatus: async (
      { uuid, data },
      config?: AxiosRequestConfig
    ) => {
      const response = await client.patch(`/grievances/${uuid}/change-status`, data, config);
      return formatResponse<Grievance>(response);
    },

    delete: async (uuid: UUID, config?: AxiosRequestConfig) => {
      const response = await client.delete(`/grievances/${uuid}`, config);
      return formatResponse<Grievance>(response);
    },
  };
}
