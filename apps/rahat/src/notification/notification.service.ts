import { Injectable } from "@nestjs/common";
import { CreateNotificationDto, GetNotificationsDto } from "@rahataid/extensions";
import { PrismaService } from "@rumsan/prisma";

@Injectable()
export class NotificationService {
    constructor(private readonly prisma: PrismaService) { }

    async createNotification(dto: CreateNotificationDto) {
        return this.prisma.notification.create({
            data: {
                ...dto,
                createdAt: new Date(),
            },
        });
    }

    async getNotifications({ projectId, group, title, description }: GetNotificationsDto) {
        return this.prisma.notification.findMany({
            where: {
                ...(projectId && { projectId }),
                ...(group && { group }),
                ...(title && { title }),
                ...(description && { description }),
            },
            orderBy: { createdAt: "desc" },
        });
    }
}