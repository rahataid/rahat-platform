// rahat-project/apps/rahat/src/notification/notification.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  Notification,
  NotificationAudience,
  NotificationChannel
} from '@prisma/client';
import {
  CreateNotificationDto,
  ListNotificationsDto,
} from '@rahataid/extensions';
import { APP_JOBS, BQUEUE, UserRoles } from '@rahataid/sdk';
import { AudienceType } from '@rahataid/sdk/enums';
import { paginator, PaginatorTypes, PrismaService } from '@rumsan/prisma';
import { Queue } from 'bull';
import { isUUID } from 'class-validator';
import { toAudienceRows } from './audience.mapper';
import { AudienceResolver, AudienceUser } from './audience.resolver';
import { PushService } from './push.service';
import { SmsService } from './sms.service'; //(TOTO : RIGHT NOW IT NOT REQUIRE , BUT KEEPING IT FOR FUTURE USE)

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });
type NotificationWithAudiences = Notification & { audiences: NotificationAudience[] };


@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectQueue(BQUEUE.RAHAT)
    private readonly rahatQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
    private readonly audienceResolver: AudienceResolver,
    private readonly smsService: SmsService //(TOTO : RIGHT NOW IT NOT REQUIRE , BUT KEEPING IT FOR FUTURE USE)
  ) { }

  async createNotification(dto: CreateNotificationDto) {
    try {
      const { title, description, group } = dto;
      const channels = this.resolveChannels(dto);
      const deliverable = channels.filter((c) => c !== NotificationChannel.IN_APP);
      const projectId = await this.validProjectId(dto.projectId);

      const notification = await this.prisma.notification.create({
        data: {
          title,
          description,
          group,
          projectId,
          channels,
          notify: deliverable.length > 0,
          audiences: { create: this.buildAudienceRows(dto) },
          createdAt: new Date(),
        },
        include: { audiences: true },
      });
      if (deliverable.length) {
        // fire and forget: a delivery problem must never fail notification creation
        void this.dispatch(notification, deliverable);
      }

      return notification;
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        message: error?.message || 'Failed to create notification',
        code: 'NOTIFICATION_CREATE_FAILED',
      });
    }
  }

  // channels from payload; legacy senders (no channels) derive them from `notify`
  private resolveChannels(dto: CreateNotificationDto): NotificationChannel[] {
    if (dto.channels?.length) return [...new Set(dto.channels)] as NotificationChannel[];
    return dto.notify
      ? [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL]
      : [NotificationChannel.IN_APP];
  }

  // an unknown project must not lose the notification (projectId is a foreign key)
  private async validProjectId(projectId?: string): Promise<string | undefined> {
    if (!projectId) return undefined;
    if (!isUUID(projectId)) {
      this.logger.warn(`[NOTIFY] projectId "${projectId}" is not a UUID, saving without project`);
      return undefined;
    }
    const project = await this.prisma.project.findUnique({ where: { uuid: projectId }, select: { uuid: true } });
    if (!project) {
      this.logger.warn(`[NOTIFY] project ${projectId} not found, saving without project`);
      return undefined;
    }
    return projectId;
  }

  private defaultRoles(): string[] {
    const env = process.env.PUSH_DEFAULT_ROLES?.split(',').map((r) => r.trim()).filter(Boolean);
    return env?.length ? env : [UserRoles.ADMIN, UserRoles.MANAGER];
  }

  // no include-selector in the payload (legacy sender) -> default roles; stored as rows so the DB shows who was targeted
  private buildAudienceRows(dto: CreateNotificationDto) {
    const rows = toAudienceRows(dto.audience);
    if (!rows.some((r) => !r.exclude)) {
      this.logger.warn('[NOTIFY] No audience in payload, using default roles. Send `audience` from the sender.');
      rows.push(...this.defaultRoles().map((role) => ({ type: AudienceType.ROLE, value: role, exclude: false })));
    }
    return rows;
  }


  private async dispatch(notification: NotificationWithAudiences, channels: NotificationChannel[]) {
    try {
      const users = await this.audienceResolver.resolve(
        notification.audiences,
        notification.projectId ?? undefined
      );
      if (!users.length) {
        // an explicit audience that resolves to nobody sends to nobody
        this.logger.warn(`[NOTIFY] #${notification.id} audience resolved to 0 users, nothing sent`);
        return;
      }
      this.logger.log(
        `[NOTIFY] #${notification.id} group="${notification.group}" users=${users.length} channels=${channels.join(',')}`
      );

      const wanted = new Set(channels);
      const tasks: Promise<unknown>[] = [];

      if (wanted.has(NotificationChannel.PUSH)) {
        tasks.push(this.pushService.pushForNotification(notification, { userIds: users.map((u) => u.uuid) }));
      }
      if (wanted.has(NotificationChannel.EMAIL)) tasks.push(this.queueEmail(notification, users));
      if (wanted.has(NotificationChannel.SMS)) tasks.push(this.sendSms(notification, users));

      await Promise.allSettled(tasks);
    } catch (err: any) {
      this.logger.error(`[NOTIFY] dispatch failed (notification already saved): ${err?.message}`, err?.stack);
    }
  }

  private async queueEmail(notification: Notification, users: AudienceUser[]) {
    const usersEmail = users.map((u) => u.email).filter((e): e is string => !!e);
    if (!usersEmail.length) {
      this.logger.warn(`[NOTIFY] #${notification.id} no email addresses in audience`);
      return;
    }
    await this.rahatQueue.add(
      APP_JOBS.NOTIFY,
      { usersEmail, subject: notification.title, text: notification.description },
      { attempts: 3, removeOnComplete: true, backoff: { type: 'exponential', delay: 1000 } }
    );
  }

  private async sendSms(notification: Notification, users: AudienceUser[]) {
    const phones = users.map((u) => u.phone).filter((p): p is string => !!p);
    if (!phones.length) {
      this.logger.warn(`[NOTIFY] #${notification.id} no phone numbers in audience`);
      return;
    }
    await this.smsService.send(phones, `${notification.title}\n${notification.description}`);
  }

  async listNotifications({
    projectId,
    group,
    title,
    page,
    perPage,
  }: ListNotificationsDto): Promise<
    PaginatorTypes.PaginatedResult<Notification>
  > {
    try {
      const query = {
        where: {
          ...(projectId && { projectId }),
          ...(group && { group }),
          ...(title && { title }),
        },
        include: {
          project: true,
        },
        orderBy: { createdAt: 'desc' },
      };
      return paginate(this.prisma.notification, query, {
        page,
        perPage,
      });
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        message: error?.message || 'Failed to list notifications',
        code: 'NOTIFICATION_LIST_FAILED',
      });
    }
  }

  async getNotification(dto: { id: number }) {
    const { id } = dto;
    try {
      return await this.prisma.notification.findUnique({
        where: {
          id,
        },
        include: {
          project: true,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        message: error?.message || 'Failed to fetch notification',
        code: 'NOTIFICATION_FETCH_FAILED',
      });
    }
  }

  async sendDisbursementEmailNotification(data: {
    actionType: 'INITIATED' | 'EXECUTED';
    projectId: string;
    disbursementId: string;
    disbursementType: 'INDIVIDUAL' | 'GROUP';
    amount: string;
    beneficiariesCount: number;
    network: string;
  }) {
    const {
      projectId,
      disbursementId,
      disbursementType,
      amount,
      beneficiariesCount,
      actionType,
      network,
    } = data;

    const { ADMIN, AIDLINK_PROJECT_MANAGER } = UserRoles;

    const roleFilter = {
      deletedAt: null,
      UserRole: {
        some: {
          Role: {
            name: { in: [ADMIN, AIDLINK_PROJECT_MANAGER] },
          },
        },
      },
    };

    const users = await this.prisma.user.findMany({ where: roleFilter });

    if (users.length === 0) {
      this.logger.warn('No users found to notify.');
      return;
    }

    const usersEmail = users?.map((user) => user.email);

    let queueData = {};

    if (actionType === 'INITIATED') {
      queueData = {
        usersEmail,
        subject: `Disbursement Initiated for AidLink Project`,
        text: `
      <p>
      A new disbursement of <strong>${amount} USDC</strong> 
      to <strong>${beneficiariesCount} beneficiar${beneficiariesCount > 1 ? 'ies' : 'y'}</strong> 
      has been initiated for the AidLink Project.
      </p>

       <p>
      Please review and approve the transaction on the Gnosis Safe to proceed.
      </p>

      <div style="background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p><strong>Summary:</strong></p>
      <p>Token: USDC (${network} Network)</p>
      <p>Beneficiaries: ${beneficiariesCount}</p>
      <p>Amount per beneficiary: ${Number(amount) / beneficiariesCount} USDC</p>
      <p>
        View Details: 
        <a href="${process.env.FRONTEND_URL}/projects/aidlink/${projectId}/disbursement/${disbursementId}" target="_blank" style="color: #1a73e8; text-decoration: none;">
          View Disbursement ↗
        </a>
      </p>
      </div>

       <p>
      Once all signatures are completed, the transfer will be executed and funds will be sent to the verified wallet.
      </p>

      <p>Best regards, </p>
      <p>Team Rahat </p>
      `,
      };

    } else if (actionType === 'EXECUTED') {
      queueData = {
        usersEmail,
        subject: `Disbursement Successfully Executed`,
        text: `
      <p>
      The <strong>${amount} USDC</strong> disbursement for the <strong>AidLink Project</strong> 
      has been successfully executed. All verified beneficiaries have received their tokens 
      in their wallets.
    </p>

    <div style="border: 1px solid #eee; padding: 16px; border-radius: 8px; background: #fafafa; margin-top: 20px;">
      <p style="font-weight: bold; margin-bottom: 10px;">Summary:</p>
      <p><strong>Token:</strong> USDC (${network} Network)</p>
      <p><strong>Total Distributed:</strong> ${amount} USDC</p>
      <p><strong>Beneficiaries:</strong> ${beneficiariesCount}</p>
      <p>
        <strong>View Details:</strong>
        <a href="${process.env.FRONTEND_URL}/projects/aidlink/${projectId}/disbursement/${disbursementId}" 
           style="color: #1a73e8; text-decoration: none;">
          View Disbursement ↗
        </a>
      </p>
    </div>

    <p style="margin-top: 20px;">
      Please coordinate with local partners to confirm receipt and verification. 
      A complete transaction report is available in the 
      <strong>Rahat Dashboard → Project Reports</strong> section.
    </p>

    <div style="margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL}/projects/aidlink/${projectId}" 
         style="display: inline-block; background-color: #1a73e8; color: white; 
                padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">
         Open Dashboard
      </a>
    </div>

    <p style="margin-top: 30px;">Best regards,<br>Team Rahat</p>
      `,
      };
    }

    await this.rahatQueue.add(APP_JOBS.NOTIFY, queueData, {
      attempts: 3,
      removeOnComplete: true,
      backoff: { type: 'exponential', delay: 1000 },
    });

  }
}