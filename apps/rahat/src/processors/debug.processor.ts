import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JOBS, QUEUE } from '../constants';
import { SlackService } from '../utils/slack.service';

@Processor(QUEUE.DEBUG)
export class DebugProcessor {
  private readonly logger = new Logger(DebugProcessor.name);
  constructor(private slackService: SlackService) {}

  @Process(JOBS.OTP)
  async processOTP(job: Job<any>) {
    console.log('OTP sent');
    this.slackService.send(
      `OTP for login: ${job.data.otp}\n access_token: ${job.data.access_token}`
    );
    // this.emailService.sendEmail(
    //   job.data.address,
    //   'OTP for login',
    //   'OTP for login',
    //   `<h1>OTP for login</h1><p>${job.data.otp}</p>`
    // );
  }
}
