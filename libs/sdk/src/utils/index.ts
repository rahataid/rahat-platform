import { AxiosResponse } from 'axios';
import { Response } from '../types/response.types';
export const formatResponse = <T>(response: AxiosResponse) => {
  return {
    data: <T>response.data.data,
    response: <Response<T>>response.data,
    httpReponse: response,
  };
};
