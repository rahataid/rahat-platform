import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TResponse } from '../types/response.types';
import { Beneficiary } from './beneficiary.service';

class RahatClient {
  private static axiosInstance: AxiosInstance | null = null;

  public static setup(config?: AxiosRequestConfig): void {
    RahatClient.axiosInstance = axios.create(config);
  }

  public static get instance(): AxiosInstance {
    if (!RahatClient.axiosInstance) {
      throw new Error(
        'RahatClient has not been initialized. Call setup() first.'
      );
    }
    return RahatClient.axiosInstance;
  }

  public static Beneficiary = Beneficiary;
}

export default RahatClient;

export function formatResponse<T>(response: AxiosResponse) {
  return {
    data: <T>response.data.data,
    response: <TResponse<T>>response.data,
    httpReponse: response,
  };
}
