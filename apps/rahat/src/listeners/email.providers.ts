import { SettingsService } from '@rumsan/extensions/settings';
import axios from 'axios';
import * as nodemailer from 'nodemailer';

export interface EmailMessage {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  sendMail(message: EmailMessage): Promise<void>;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export class NodemailerProvider implements EmailProvider {
  private transporter: { sendMail(message: EmailMessage): Promise<unknown> };

  async sendMail(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        pool: true,
        host: SettingsService.get('SMTP.HOST'),
        port: SettingsService.get('SMTP.PORT'),
        secure: SettingsService.get('SMTP.SECURE'),
        auth: {
          user: SettingsService.get('SMTP.USERNAME'),
          pass: SettingsService.get('SMTP.PASSWORD'),
        },
      });
    }
    await this.transporter.sendMail(message);
  }
}

export class SendGridProvider implements EmailProvider {
  async sendMail(message: EmailMessage): Promise<void> {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    await axios.post('https://api.sendgrid.com/v3/mail/send', {
      personalizations: [{ to: recipients.map((email) => ({ email })) }],
      from: { email: message.from },
      subject: message.subject,
      content: [
        { type: 'text/plain', value: message.text },
        ...(message.html ? [{ type: 'text/html', value: message.html }] : []),
      ],
    }, {
      headers: { Authorization: `Bearer ${requiredEnv('SENDGRID_API_KEY')}` },
      timeout: 15000,
      maxRedirects: 0,
    });
  }
}

export class MailgunProvider implements EmailProvider {
  async sendMail(message: EmailMessage): Promise<void> {
    const domain = requiredEnv('MAILGUN_DOMAIN');
    const region = process.env.MAILGUN_REGION || 'us';
    if (region !== 'us' && region !== 'eu') {
      throw new Error('MAILGUN_REGION must be us or eu');
    }
    const host = region === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
    const form = new URLSearchParams();
    form.set('from', message.from);
    for (const recipient of Array.isArray(message.to) ? message.to : [message.to]) {
      form.append('to', recipient);
    }
    form.set('subject', message.subject);
    form.set('text', message.text);
    if (message.html) form.set('html', message.html);
    await axios.post(`https://${host}/v3/${encodeURIComponent(domain)}/messages`, form.toString(), {
      auth: { username: 'api', password: requiredEnv('MAILGUN_API_KEY') },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      maxRedirects: 0,
    });
  }
}

export class CustomEmailProvider implements EmailProvider {
  async sendMail(message: EmailMessage): Promise<void> {
    const url = new URL(requiredEnv('EMAIL_CUSTOM_URL'));
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('EMAIL_CUSTOM_URL must use HTTPS without embedded credentials');
    }
    const token = requiredEnv('EMAIL_CUSTOM_TOKEN');
    await axios.post(url.toString(), message, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
      maxRedirects: 0,
    });
  }
}
