// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { APP_JOBS, BQUEUE } from '@rahataid/sdk';
import { Job } from 'bull';
import { EmailService } from '../listeners/email.service';

@Processor(BQUEUE.RAHAT)
export class RahatProcessor {
  private readonly logger = new Logger(RahatProcessor.name);
  constructor(
    private emailService: EmailService
  ) { }

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
  async sendNotifyEmail(job: Job<{ usersEmail: string[], subject: string, text: string }>) {
    const data = job.data;
    const { usersEmail, subject, text } = data;
    await this.emailService.sendEmail(
      usersEmail,
      subject,
      `
      Hi,

      ${text}
      `
    );
  }

}
