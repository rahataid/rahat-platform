// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '@rumsan/extensions/settings';
import {
  CustomEmailProvider,
  EmailProvider,
  MailgunProvider,
  NodemailerProvider,
  SendGridProvider,
} from './email.providers';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly providers = new Map<string, EmailProvider>([
    ['nodemailer', new NodemailerProvider()],
    ['sendgrid', new SendGridProvider()],
    ['mailgun', new MailgunProvider()],
    ['custom', new CustomEmailProvider()],
  ]);

  async sendEmail(
    to: string | string[],
    subject: string,
    text: string,
    html?: string
  ): Promise<void> {
    const primary = (process.env.EMAIL_PROVIDER || 'nodemailer').trim().toLowerCase();
    const fallbacks = (process.env.EMAIL_FALLBACK_PROVIDERS || '')
      .split(',')
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);
    const names = [...new Set([primary, ...fallbacks])];
    const providers = names.map((name) => {
      const provider = this.providers.get(name);
      if (!provider) throw new Error(`Unknown email provider: ${name}`);
      return { name, provider };
    });
    const from = process.env.EMAIL_FROM || SettingsService.get('SMTP.USERNAME');
    if (!from) throw new Error('EMAIL_FROM or SMTP.USERNAME is required');

    for (const { name, provider } of providers) {
      try {
        await provider.sendMail({ from, to, subject, text, html });
        return;
      } catch (error) {
        this.logger.error(`Email provider ${name} failed: ${error.message}`);
      }
    }
    throw new Error(`All configured email providers failed: ${names.join(', ')}`);
  }
}
