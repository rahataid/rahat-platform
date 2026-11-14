import { Pagination } from '@rumsan/sdk/types';
import { AxiosRequestConfig } from 'axios';

export function withPagination(
  pagination?: Partial<Pagination>,
  config?: AxiosRequestConfig
): AxiosRequestConfig {
  const params: unknown = config?.params;
  if (!pagination || params == null) {
    return { ...config, params: params ?? pagination };
  }

  if (params instanceof URLSearchParams) {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(pagination)) {
      if (value != null && !merged.has(key)) merged.append(key, String(value));
    }
    return { ...config, params: merged };
  }

  if (
    typeof params !== 'object' ||
    (Object.getPrototypeOf(params) !== Object.prototype &&
      Object.getPrototypeOf(params) !== null)
  ) {
    throw new TypeError('Request parameters must be an object or URLSearchParams');
  }
  return { ...config, params: { ...pagination, ...params } };
}
