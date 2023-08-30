import { Injectable, Logger } from '@nestjs/common';
import { SENT_OTP, MAIL_QUEUE, WELCOME_MSG } from './constants';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { jobOptions } from './config/bullOptions';

@Injectable()
export class MailService {
  private readonly _logger = new Logger(MailService.name);

  constructor(@InjectQueue(MAIL_QUEUE) private readonly _mailQueue: Queue) {}

  public async sendOTP({ email, otp }: { email: string; otp: string }): Promise<void> {
    try {
      await this._mailQueue.add(
        SENT_OTP,
        {
          email,
          otp,
        },
        jobOptions,
      );
    } catch (error) {
      this._logger.error(`Error queueing registration email to user ${email}`);
      throw error;
    }
  }

  public async welcome({ name, email }: { name: string; email: string }): Promise<void> {
    try {
      await this._mailQueue.add(
        WELCOME_MSG,
        {
          name,
          email,
        },
        jobOptions,
      );
    } catch (error) {
      this._logger.error(`Error queueing registration email to user ${email}`);
      throw error;
    }
  }
}
