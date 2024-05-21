import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { BQUEUE, ProjectEvents, ProjectJobs } from '@rahataid/sdk';
import { Project } from '@rahataid/sdk/project/project.types';
import { PrismaService } from '@rumsan/prisma';
import { EVENTS } from '@rumsan/user';
import { Queue } from 'bull';
import { DevService } from '../utils/develop.service';
import { EmailService } from './email.service';
import { MessageSenderService } from './messageSender.service';
@Injectable()
export class ListenersService {
  private otp: string;
  private dev: DevService;
  constructor(
    @InjectQueue(BQUEUE.RAHAT) private readonly rahatQueue: Queue,
    @InjectQueue(BQUEUE.HOST) private readonly hostQueue: Queue,
    @InjectQueue(BQUEUE.RAHAT_PROJECT) private readonly projectQueue: Queue,
    private readonly configService: ConfigService,
    protected prisma: PrismaService,

    private readonly devService: DevService,
    private emailService: EmailService,
    private messageSenderService: MessageSenderService,

  ) { }

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
  @OnEvent(EVENTS.USER_CREATED)
  async sendUserCreatedEmail(data: any) {
    this.emailService.sendEmail(
      data.address,
      'You has been added to rahat.',
      `You has been successfully added to rahat. Please follow the link "${this.configService.get('FRONTEND_URL')}" to join.`
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
  @OnEvent(ProjectEvents.BENEFICIARY_ADDED_TO_PROJECT)
  async onProjectAddedToBen(data) {
    const CONTENT_SID = this.configService.get('REFERRED_VOUCHER_ASSIGNED_SID');
    for (const beneficiary of data.beneficiaries) {
      const payload = {
        phone: beneficiary.piiData.phone,
        type: 'WHATSAPP',
        contentSid: CONTENT_SID,
        contentVariables: {
          name: beneficiary.piiData.name,
        },
      };

      this.messageSenderService.sendWhatappMessage(payload)
    }

  }
  @OnEvent(ProjectEvents.REQUEST_REDEMPTION)
  async onRequestRedemption() {
    const admins = await this.prisma.user.findMany({
      where: {
        UserRole: {
          some: {
            Role: {
              name: 'Admin',
            },
          },
        },
      },
    });
    admins.map((admin) => {
      const CONTENT_SID = this.configService.get('REDEMPTION_REQUEST_SID');
      const payload = {
        phone: admin.phone,
        type: 'WHATSAPP',
        contentSid: CONTENT_SID,

      };
      this.messageSenderService.sendWhatappMessage(payload)

    })

  }
}
