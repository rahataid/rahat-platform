import { SettingsService } from '@rumsan/extensions/settings';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('axios');
jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('EmailService providers', () => {
  const originalEnv = process.env;
  const sendMail = jest.fn();
  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      EMAIL_PROVIDER: 'nodemailer',
      EMAIL_FALLBACK_PROVIDERS: '',
      EMAIL_FROM: 'sender@example.org',
      SENDGRID_API_KEY: 'sendgrid-test',
      MAILGUN_API_KEY: 'mailgun-test',
      MAILGUN_DOMAIN: 'example.org',
      MAILGUN_REGION: 'us',
      EMAIL_CUSTOM_URL: 'https://email.example.org/send',
      EMAIL_CUSTOM_TOKEN: 'custom-test',
    };
    jest.spyOn(SettingsService, 'get').mockReturnValue('smtp-setting');
    jest.mocked(nodemailer.createTransport).mockReturnValue({ sendMail });
    sendMail.mockResolvedValue({});
    jest.mocked(axios.post).mockResolvedValue({ status: 202 });
    service = new EmailService();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('uses the existing SMTP settings by default', async () => {
    await service.sendEmail('user@example.org', 'subject', 'text', '<p>text</p>');
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      pool: true, host: 'smtp-setting',
    }));
    expect(sendMail).toHaveBeenCalledWith({
      from: 'sender@example.org', to: 'user@example.org', subject: 'subject',
      text: 'text', html: '<p>text</p>',
    });
  });

  it('uses the configured SMTP username when EMAIL_FROM is not set', async () => {
    delete process.env.EMAIL_FROM;
    await service.sendEmail('user@example.org', 'subject', 'text');
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: 'smtp-setting' }));
  });

  it('dispatches SendGrid messages with all recipients and content', async () => {
    process.env.EMAIL_PROVIDER = 'sendgrid';
    await service.sendEmail(['one@example.org', 'two@example.org'], 'subject', 'text', '<b>text</b>');
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.sendgrid.com/v3/mail/send',
      expect.objectContaining({
        personalizations: [{ to: [{ email: 'one@example.org' }, { email: 'two@example.org' }] }],
        content: [{ type: 'text/plain', value: 'text' }, { type: 'text/html', value: '<b>text</b>' }],
      }),
      expect.objectContaining({ headers: { Authorization: 'Bearer sendgrid-test' } })
    );
  });

  it('dispatches Mailgun form data to the selected region', async () => {
    process.env.EMAIL_PROVIDER = 'mailgun';
    process.env.MAILGUN_REGION = 'eu';
    await service.sendEmail(['one@example.org', 'two@example.org'], 'subject', 'text');
    const [url, body, options] = jest.mocked(axios.post).mock.calls[0];
    expect(url).toBe('https://api.eu.mailgun.net/v3/example.org/messages');
    if (typeof body !== 'string') throw new Error('Expected form-encoded body');
    expect(new URLSearchParams(body).getAll('to')).toEqual(['one@example.org', 'two@example.org']);
    expect(options.auth).toEqual({ username: 'api', password: 'mailgun-test' });
  });

  it('sends a custom provider JSON request over HTTPS', async () => {
    process.env.EMAIL_PROVIDER = 'custom';
    await service.sendEmail('user@example.org', 'subject', 'text');
    expect(axios.post).toHaveBeenCalledWith(
      'https://email.example.org/send',
      { from: 'sender@example.org', to: 'user@example.org', subject: 'subject', text: 'text', html: undefined },
      expect.objectContaining({ headers: { Authorization: 'Bearer custom-test' } })
    );
  });

  it('tries fallbacks in order and stops after success', async () => {
    process.env.EMAIL_PROVIDER = 'sendgrid';
    process.env.EMAIL_FALLBACK_PROVIDERS = 'mailgun, nodemailer';
    jest.mocked(axios.post).mockRejectedValueOnce(new Error('unavailable')).mockResolvedValueOnce({ status: 200 });
    await service.sendEmail('user@example.org', 'subject', 'text');
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('rejects unknown providers before attempting delivery', async () => {
    process.env.EMAIL_FALLBACK_PROVIDERS = 'unknown';
    await expect(service.sendEmail('user@example.org', 'subject', 'text')).rejects.toThrow('Unknown email provider: unknown');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('rejects inherited object property names as unknown providers', async () => {
    process.env.EMAIL_PROVIDER = 'constructor';
    await expect(service.sendEmail('user@example.org', 'subject', 'text')).rejects.toThrow('Unknown email provider: constructor');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('surfaces failure when all providers fail', async () => {
    process.env.EMAIL_FALLBACK_PROVIDERS = 'sendgrid';
    sendMail.mockRejectedValue(new Error('SMTP down'));
    jest.mocked(axios.post).mockRejectedValue(new Error('API down'));
    await expect(service.sendEmail('user@example.org', 'subject', 'text')).rejects.toThrow(
      'All configured email providers failed: nodemailer, sendgrid'
    );
  });

  it('rejects an insecure custom endpoint without sending credentials', async () => {
    process.env.EMAIL_PROVIDER = 'custom';
    process.env.EMAIL_CUSTOM_URL = 'http://email.example.org/send';
    await expect(service.sendEmail('user@example.org', 'subject', 'text')).rejects.toThrow('All configured email providers failed');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('rejects missing provider credentials without attempting a request', async () => {
    process.env.EMAIL_PROVIDER = 'sendgrid';
    delete process.env.SENDGRID_API_KEY;
    await expect(service.sendEmail('user@example.org', 'subject', 'text')).rejects.toThrow('All configured email providers failed');
    expect(axios.post).not.toHaveBeenCalled();
  });
});
