import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Notification } from '@prisma/client';
import {
  CreateNotificationDto,
  ListNotificationsDto,
} from '@rahataid/extensions';
import { APP_JOBS, BQUEUE, UserRoles } from '@rahataid/sdk';
import { paginator, PaginatorTypes, PrismaService } from '@rumsan/prisma';
import { Queue } from 'bull';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectQueue(BQUEUE.RAHAT)
    private readonly rahatQueue: Queue,
    private readonly prisma: PrismaService
  ) { }

  async createNotification(dto: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          ...dto,
          createdAt: new Date(),
        },
      });

      if (notification.notify) {
        this.notifyUsers(notification);
      }

      return notification;
    } catch (error) {
      this.logger.error(error);
      throw new RpcException(error?.message || 'Failed to create notification');
    }
  }

  private async notifyUsers(notification: Notification) {
    const { ADMIN, MANAGER } = UserRoles;

    const roleFilter = {
      deletedAt: null,
      UserRole: {
        some: {
          Role: {
            name: { in: [ADMIN, MANAGER] },
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

    const queueData = {
      usersEmail,
      subject: notification.title,
      text: notification.description,
    };

    await this.rahatQueue.add(APP_JOBS.NOTIFY, queueData, {
      attempts: 3,
      removeOnComplete: true,
      backoff: { type: 'exponential', delay: 1000 },
    });

    this.logger.log(`Queued notification for ${users.length} users.`);
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
      throw new RpcException(error?.message || 'Failed to list notifications');
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
      throw new RpcException(error?.message || 'Failed to fetch notification');
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

    this.logger.log(`Queued notification for ${users.length} users.`);
  }
}
