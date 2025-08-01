import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { CreateNotificationDto, GetNotificationsDto } from "@rahataid/extensions";
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
    async getNotifications(dto: GetNotificationsDto) {
        return this.notificationService.getNotifications(dto);
    }
}