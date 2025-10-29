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
        subject: `Disbursement of ${amount} USDC Initiated for AidLink Project - Action Required`,
        text: `
      The disbursement of ${amount} USDC to ${beneficiariesCount} project beneficiaries has been initiated for the AidLink Project.
      Please review the disbursement details and proceed with the next steps:

      🔹 Disbursement Details: ${process.env.FRONTEND_URL}/projects/aidlink/${projectId}/disbursement/${disbursementId}
      🔹 Token: USDC (${network} Network)
      🔹 Beneficiaries: ${beneficiariesCount}
      🔹 Amount per beneficiary: ${Number(amount) / beneficiariesCount} USDC 

      We request the Project Manager to kindly coordinate with the Safe Wallet owners to review and approve the transaction on the Gnosis Safe wallet.

      Once all signatures are approved, the system will automatically execute the transfer, and the USDC will be disbursed to the verified beneficiary wallets.

      Best regards,
      Team Rahat
      `,
      };
    } else if (actionType === 'EXECUTED') {
      queueData = {
        usersEmail,
        subject: `Disbursement Successfully Executed for AidLink Project`,
        text: `
      We are pleased to inform you that the ${amount} USDC disbursement for the AidLink Project has been successfully executed.

      All verified beneficiaries have now received their allocated tokens in their respective wallets.
      You can review the transaction details and disbursement summary below:

      🔹 Disbursement Summary: ${process.env.FRONTEND_URL}/projects/aidlink/${projectId}/disbursement/${disbursementId}
      🔹 Token: USDC (${network} Network)
      🔹 Total Amount Distributed: ${amount}
      🔹 Number of Beneficiaries: ${beneficiariesCount}

      We request the Project Manager to kindly coordinate with the local community partners and field representatives to confirm that beneficiaries have successfully received the tokens.

      A complete transaction report can be accessed via the Project Reports section on the Rahat Dashboard.

      Best regards,
      Team Rahat
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
