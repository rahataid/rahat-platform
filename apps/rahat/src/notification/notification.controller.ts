import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { CreateNotificationDto, ListNotificationsDto, } from "@rahataid/extensions";
import { ProjectJobs } from "@rahataid/sdk";
import { NotificationService } from "./notification.service";

@Controller()
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @MessagePattern({ cmd: ProjectJobs.NOTIFICATION.CREATE })
    async createNotification(dto: CreateNotificationDto) {
        return this.notificationService.createNotification(dto);
    }

    @MessagePattern({ cmd: ProjectJobs.NOTIFICATION.LIST })
    async listNotifications(dto: ListNotificationsDto) {
        return this.notificationService.listNotifications(dto);
    }

    @MessagePattern({ cmd: ProjectJobs.NOTIFICATION.GET })
    async getNotification(dto: { id: number }) {
        return this.notificationService.getNotification(dto);
    }
}