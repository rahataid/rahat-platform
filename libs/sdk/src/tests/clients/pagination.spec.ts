import axios, { AxiosRequestConfig } from 'axios';
import { Pagination } from '@rumsan/sdk/types';
import { getBeneficiaryClient } from '../../clients/beneficiary.client';
import { getAppClient } from '../../clients/app.client';
import { getGrievanceClient } from '../../clients/grievance.client';
import { getSettingsClient } from '../../clients/settings.client';
import { getVendorClient } from '../../clients/vendor.client';

jest.mock('@rumsan/sdk/utils', () => ({ formatResponse: jest.fn() }));

describe('SDK list pagination', () => {
  const http = axios.create();
  const get = jest.spyOn(http, 'get').mockResolvedValue({});
  const pagination: Pagination = { page: 2, perPage: 25 };
  const beneficiary = getBeneficiaryClient(http);
  const vendor = getVendorClient(http);
  const grievance = getGrievanceClient(http);
  const settings = getSettingsClient(http);
  const app = getAppClient(http);
  const routes: [string, (config: AxiosRequestConfig) => Promise<unknown>][] = [
    ['/beneficiaries', (config) => beneficiary.list(pagination, config)],
    ['/beneficiaries/pii', (config) => beneficiary.listPiiData(pagination, config)],
    ['/beneficiaries/temp/group', (config) => beneficiary.listTempBeneficiary('group', pagination, config)],
    ['/beneficiaries/temp-groups', (config) => beneficiary.listTempGroups(pagination, config)],
    ['/vendors', (config) => vendor.list(pagination, config)],
    ['/grievances', (config) => grievance.list(pagination, config)],
    ['/settings', (config) => settings.listSettings(pagination, config)],
    ['/app/auth-apps', (config) => app.listAuthApps(pagination, config)],
  ];

  beforeEach(() => get.mockClear());

  it.each(routes)('merges pagination and filters for %s', async (path, list) => {
    const config = { params: { status: 'active', page: 3 }, headers: { test: 'header' } };
    await list(config);
    expect(get).toHaveBeenCalledWith(path, {
      headers: config.headers,
      params: { page: 3, perPage: 25, status: 'active' },
    });
    expect(config.params).toEqual({ status: 'active', page: 3 });
  });

  it('preserves repeated URLSearchParams and does not mutate them', async () => {
    const params = new URLSearchParams('tag=a&tag=b&page=3');
    await beneficiary.list(pagination, { params });
    const merged = get.mock.calls[0][1].params;
    expect(merged).toBeInstanceOf(URLSearchParams);
    expect(merged.getAll('tag')).toEqual(['a', 'b']);
    expect(merged.get('page')).toBe('3');
    expect(merged.get('perPage')).toBe('25');
    expect(params.has('perPage')).toBe(false);
  });

  it('rejects unsupported query parameter types instead of dropping pagination', async () => {
    await expect(beneficiary.list(pagination, { params: 'page=3' })).rejects.toThrow(TypeError);
    expect(get).not.toHaveBeenCalled();
  });
});
