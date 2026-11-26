import { HealthService } from './health.service';

describe('HealthService alert recipients', () => {
  const originalRecipients = process.env.HEALTH_ALERT_EMAILS;
  const emailService = { sendEmail: jest.fn().mockResolvedValue(undefined) };
  let service: HealthService;

  beforeEach(() => {
    emailService.sendEmail.mockClear();
    service = new HealthService(
      {} as any,
      emailService as any,
      {} as any,
      {} as any
    );
  });

  afterAll(() => {
    if (originalRecipients === undefined) {
      delete process.env.HEALTH_ALERT_EMAILS;
    } else {
      process.env.HEALTH_ALERT_EMAILS = originalRecipients;
    }
  });

  it('uses the same trimmed recipient list for down and restored alerts', async () => {
    process.env.HEALTH_ALERT_EMAILS = ' ops@example.org, , oncall@example.org ';

    await service.sendHealthAlertEmail([{ name: 'Database' }]);
    await service.sendHealthRestoredEmail([{ name: 'Database' }]);

    expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
    expect(emailService.sendEmail.mock.calls[0][0]).toEqual([
      'ops@example.org',
      'oncall@example.org',
    ]);
    expect(emailService.sendEmail.mock.calls[1][0]).toEqual([
      'ops@example.org',
      'oncall@example.org',
    ]);
  });

  it('skips both emails when no recipients are configured', async () => {
    process.env.HEALTH_ALERT_EMAILS = ' ,  ';

    await service.sendHealthAlertEmail([{ name: 'Database' }]);
    await service.sendHealthRestoredEmail([{ name: 'Database' }]);

    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });
});
