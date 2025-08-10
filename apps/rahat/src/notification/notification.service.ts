import { Injectable, Logger } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { CreateNotificationDto, ListNotificationsDto } from "@rahataid/extensions";
import { paginator, PaginatorTypes, PrismaService } from "@rumsan/prisma";

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class NotificationService {
    logger = new Logger(NotificationService.name);
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async createNotification(dto: CreateNotificationDto) {
        try {
            return await this.prisma.notification.create({
                data: {
                    ...dto,
                    createdAt: new Date(),
                },
            });
        } catch (error) {
            this.logger.error(error);
            throw new RpcException(error?.message || "Failed to create notification");
        }
    }

    async listNotifications({ projectId, group, title, page, perPage }: ListNotificationsDto): Promise<PaginatorTypes.PaginatedResult<Notification>> {
        try {
            const query = {
                where: {
                    ...(projectId && { projectId }),
                    ...(group && { group }),
                    ...(title && { title }),
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