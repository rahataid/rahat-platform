import axios from 'axios';
import { getBeneficiaryClient } from '../../clients/beneficiary.client';
import { getSettingsClient } from '../../clients/settings.client';

jest.mock('@rumsan/sdk/utils', () => ({ formatResponse: jest.fn() }));

describe('SDK path parameters', () => {
  const http = axios.create();
  const get = jest.spyOn(http, 'get').mockResolvedValue({});
  const patch = jest.spyOn(http, 'patch').mockResolvedValue({});
  const beneficiaries = getBeneficiaryClient(http);
  const settings = getSettingsClient(http);

  beforeEach(() => {
    get.mockClear();
    patch.mockClear();
  });

  it('encodes an international phone number as a path segment', async () => {
    await beneficiaries.getByPhone('+12025550123');
    expect(get).toHaveBeenCalledWith('/beneficiaries/phone/%2B12025550123', undefined);
  });

  it('encodes a temporary group identifier as a path segment', async () => {
    await beneficiaries.listTempBeneficiary('abc/def?x=y');
    expect(get).toHaveBeenCalledWith('/beneficiaries/temp/abc%2Fdef%3Fx%3Dy', { params: undefined });
  });

  it('encodes setting names for reads and updates', async () => {
    const data = {
      name: 'a/b?c#d% +é',
      value: {},
      requiredFields: [],
      isReadOnly: false,
      isPrivate: false,
    };
    const path = '/settings/a%2Fb%3Fc%23d%25%20%2B%C3%A9';
    await settings.getByName(data.name);
    await settings.update(data);
    expect(get).toHaveBeenCalledWith(path, undefined);
    expect(patch).toHaveBeenCalledWith(path, data, undefined);
  });
});
