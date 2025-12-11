import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Notification } from "@prisma/client";
import { CreateNotificationDto, ListNotificationsDto } from "@rahataid/extensions";
import { APP_JOBS, BQUEUE, UserRoles } from "@rahataid/sdk";
import { paginator, PaginatorTypes, PrismaService } from "@rumsan/prisma";
import { Queue } from "bull";

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectQueue(BQUEUE.RAHAT)
    private readonly rahatQueue: Queue,
    private readonly prisma: PrismaService,
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

    const usersEmail = users?.map((user) => user.email)

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

  async listNotifications({ projectId, group, title, page, perPage }: ListNotificationsDto): Promise<PaginatorTypes.PaginatedResult<Notification>> {
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
        orderBy: { createdAt: "desc" },
      }
      return paginate(this.prisma.notification, query, {
        page,
        perPage
      })
    } catch (error) {
      this.logger.error(error);
      throw new RpcException(error?.message || "Failed to list notifications");
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
        }
      });
    } catch (error) {
      this.logger.error(error);
      throw new RpcException(error?.message || "Failed to fetch notification");
    }
  }
}
