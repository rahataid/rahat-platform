import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { JobOptions, Queue } from 'bull';
import { MAIL_QUEUE, SENT_OTP, WELCOME_MSG } from './constants';

const jobOptions: JobOptions = {
  attempts: 3,
  removeOnComplete: 20,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
}

@Injectable()
export class MailService {
  private readonly _logger = new Logger(MailService.name);

  constructor(@InjectQueue(MAIL_QUEUE) private readonly _mailQueue: Queue) {}

  public async sendOTP({
    email,
    otp,
  }: {
    email: string;
    otp: string;
  }): Promise<void> {
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

  public async welcome({
    name,
    email,
  }: {
    name: string;
    email: string;
  }): Promise<void> {
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
