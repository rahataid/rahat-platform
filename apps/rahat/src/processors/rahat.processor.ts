// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { APP_JOBS, BQUEUE } from '@rahataid/sdk';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { Job } from 'bull';
import { EmailService } from '../listeners/email.service';

@Processor(BQUEUE.RAHAT)
export class RahatProcessor {
  private readonly logger = new Logger(RahatProcessor.name);
  constructor(private emailService: EmailService, private prisma: PrismaService) { }

  @Process(APP_JOBS.EMAIL)
  async sendEmail(job: Job<any>) {
    console.log('Email sent');
    // this.emailService.sendEmail(
    //   job.data.address,
    //   'OTP for login',
    //   'OTP for login',
    //   `<h1>OTP for login</h1><p>${job.data.otp}</p>`
    // );
  }

  @Process(APP_JOBS.NOTIFY)
  async sendNotifyEmail(
    job: Job<{ usersEmail: string[]; subject: string; text: string }>
  ) {
    const data = job.data;
    const { usersEmail, subject, text } = data;

    const settings = new SettingsService(this.prisma);
    const frontendURL: any = await settings.getSettingsByName('FRONTEND_URL');

    await this.emailService.sendEmail(
      usersEmail,
      subject,
      text,
      `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px;padding: 24px; text-align: center; border: 1px solid #111111;">

          <div style="margin-bottom: 20px;">
            <img src='https://assets.rumsan.net/rumsan-group/rahat-logo-standard.png' width="150" title="Rahat" alt="Rahat";>
          </div>

          <div style="background-color: #f3f4f6; padding: 24px; border-radius: 16px; margin-bottom: 24px;">

            <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-bottom: 16px;">
              ${subject}
            </h2>

            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
              Hi, <br><br>
              ${text}
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

            <p style="font-size: 12px; color: #6b7280; margin: 0;">
              This is an automated notification from Rahat
            </p>

            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            <a
                href="${frontendURL["value"]}"
                target="_blank"
                style="color: #2563eb; text-decoration: underline; font-weight: 600;"
            >
                ${frontendURL["value"]}
            </a>
          </p>
          </div>

          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            © ${new Date().getFullYear()}, Rahat. All rights reserved.
          </p>

        </div>
      </div>
      `
    );
  }
}
