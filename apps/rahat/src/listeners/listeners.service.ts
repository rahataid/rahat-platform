import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '@rumsan/user';
import { Queue } from 'bull';
import { JOBS, QUEUE } from '../constants';
import { EVENTS as APP_EVENTS } from '../constants/events';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { DevService } from '../utils/develop.service';
import { Project } from '@prisma/client';
import { ClientProxy } from '@nestjs/microservices';
@Injectable()
export class ListenersService {
  private otp: string;
  private dev: DevService;
  constructor(
    @InjectQueue(QUEUE.RAHAT) private readonly rahatQueue: Queue,
    @InjectQueue(QUEUE.HOST) private readonly hostQueue: Queue,
    private readonly devService: DevService
  ) {}

  @OnEvent(EVENTS.OTP_CREATED)
  async sendOTPEmail(data: any) {
    this.otp = data.otp;
    await this.rahatQueue.add(JOBS.EMAIL, { test: 'test' });
  }

  @OnEvent(EVENTS.CHALLENGE_CREATED)
  async sendChallengeToDev(data: any) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.devService.otp({
      otp: this.otp,
      challenge: data.challenge.challenge,
    });
  }

  @OnEvent(APP_EVENTS.PROJECT_CREATED)
  async onProjectCreated(data: Project) {
    this.hostQueue.add(JOBS.PROJECT_CREATE, data, {
      attempts: 3,
      removeOnComplete: true,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
