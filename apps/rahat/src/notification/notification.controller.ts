import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CreateNotificationDto, ListNotificationsDto, } from "@rahataid/extensions";
import { ACTIONS, APP, ProjectJobs, SUBJECTS } from "@rahataid/sdk";
import { AbilitiesGuard, CheckAbilities, JwtGuard } from "@rumsan/user";
import { NotificationService } from "./notification.service";

@Controller('notifications')
@ApiTags('Notifications')
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

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @Get()
  list(@Query() query: ListNotificationsDto) {
    console.log("Listing notifications");
    return this.notificationService.listNotifications(query);
  }


}
