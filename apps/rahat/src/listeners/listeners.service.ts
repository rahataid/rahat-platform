import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Project } from '@prisma/client';
import { BQUEUE, ProjectEvents, ProjectJobs } from '@rahataid/sdk';
import { EVENTS } from '@rumsan/user';
import { Queue } from 'bull';
import { DevService } from '../utils/develop.service';
import { EmailService } from './email.service';
@Injectable()
export class ListenersService {
  private otp: string;
  private dev: DevService;
  constructor(
    @InjectQueue(BQUEUE.RAHAT) private readonly rahatQueue: Queue,
    @InjectQueue(BQUEUE.HOST) private readonly hostQueue: Queue,
    @InjectQueue(BQUEUE.RAHAT_PROJECT) private readonly projectQueue: Queue,
    private readonly devService: DevService,
    private emailService: EmailService
  ) {}

  @OnEvent(EVENTS.OTP_CREATED)
  async sendOTPEmail(data: any) {
    this.otp = data.otp;
    this.emailService.sendEmail(
      data.address,
      'OTP for login',
      'OTP for login',
      `<h1>OTP for login</h1><p>${data.otp}</p>`
    );
  }

  @OnEvent(EVENTS.CHALLENGE_CREATED)
  async sendChallengeToDev(data: any) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.devService.otp({
      otp: this.otp,
      challenge: data.challenge.challenge,
      requestInfo: data.requestInfo,
    });
  }

  @OnEvent(ProjectEvents.PROJECT_CREATED)
  async onProjectCreated(data: Project) {
    this.projectQueue.add(ProjectJobs.PROJECT_CREATE, data, {
      attempts: 3,
      removeOnComplete: true,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
