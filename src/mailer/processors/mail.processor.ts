import { MailerService } from '@nestjs-modules/mailer';
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { MAIL_QUEUE, SENT_OTP, WELCOME_MSG } from '../constants';

@Injectable()
@Processor(MAIL_QUEUE)
export class MailProcessor {
  private readonly _logger = new Logger(MailProcessor.name);

  constructor(
    private readonly _mailerService: MailerService,
    private readonly _configService: ConfigService,
  ) {}

  @OnQueueActive()
  public onActive(job: Job) {
    this._logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  public onComplete(job: Job) {
    this._logger.debug(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  public onError(job: Job<any>, error: any) {
    this._logger.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
    try {
      return this._mailerService.sendMail({
        to: this._configService.get('EMAIL_ADDRESS'),
        from: this._configService.get('EMAIL_ADDRESS'),
        subject: 'Something went wrong with server!!',
        template: './error',
        context: {},
      });
    } catch {
      this._logger.error('Failed to send confirmation email to admin');
    }
  }

  @Process(SENT_OTP)
  public async sendOTP(job: Job<{ email: string; otp: string }>) {
    this._logger.log(`Sending otp email to '${job.data.email}'`);

    try {
      return this._mailerService.sendMail({
        to: job.data.email,
        from: this._configService.get('EMAIL_ADDRESS'),
        subject: 'Sign In OTP',
        template: './otp',
        context: { name: job.data.email, otp: job.data.otp },
      });
    } catch {
      this._logger.error(
        `Failed to send confirmation email to '${job.data.email}'`,
      );
    }
  }

  @Process(WELCOME_MSG)
  public async welcome(job: Job<{ email: string; name: string }>) {
    this._logger.log(`Sending welcome email to '${job.data.email}'`);

    try {
      return this._mailerService.sendMail({
        to: job.data.email,
        from: this._configService.get('EMAIL_ADDRESS'),
        subject: 'Greetings from Rahat',
        template: './welcome',
        context: { name: job.data.name },
      });
    } catch {
      this._logger.error(
        `Failed to send confirmation email to '${job.data.email}'`,
      );
    }
  }
}
