import * as Sentry from '@sentry/nestjs';
import { CountryCodeHealthcheckService } from './country-code-healthcheck.service';
import { ProjectService } from './project.service';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));

describe('CountryCodeHealthcheckService', () => {
  let service: CountryCodeHealthcheckService;
  let getCode: jest.Mock;
  const capture = Sentry.captureException as unknown as jest.Mock;

  beforeEach(() => {
    capture.mockClear();
    getCode = jest.fn();
    service = new CountryCodeHealthcheckService({
      getKoboCountryCodeFromSettings: getCode,
    } as unknown as ProjectService);
  });

  it('should alert Sentry when no calling code is configured', async () => {
    getCode.mockResolvedValue('');
    expect(await service.check()).toBe(false);
    expect(capture).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({
          issue: 'country-code-missing-healthcheck',
        }),
      })
    );
  });

  it('should stay quiet when a calling code is configured', async () => {
    getCode.mockResolvedValue('+86');
    expect(await service.check()).toBe(true);
    expect(capture).not.toHaveBeenCalled();
  });

  it('should bypass the lookup cache', async () => {
    getCode.mockResolvedValue('+86');
    await service.check();
    expect(getCode).toHaveBeenCalledWith(true);
  });

  it('should never throw when the lookup itself fails', async () => {
    getCode.mockRejectedValue(new Error('db down'));
    await expect(service.check()).resolves.toBe(false);
  });
});
