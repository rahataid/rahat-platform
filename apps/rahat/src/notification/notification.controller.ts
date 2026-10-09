// rahat-project/apps/rahat/src/notification/notification.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateNotificationDto,
  ListNotificationsDto,
} from '@rahataid/extensions';
import { ACTIONS, APP, ProjectJobs, SUBJECTS } from '@rahataid/sdk';
import { AbilitiesGuard, CheckAbilities, JwtGuard } from '@rumsan/user';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { SubscribeWebPushDto } from "./dto/subscribe-web-push.dto";
import { NotificationService } from './notification.service';
import { PushService } from './push.service';

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushService
  ) { }

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

  @MessagePattern({ cmd: ProjectJobs.NOTIFICATION.REGISTER_DEVICE })
  async registerDevice(dto: RegisterDeviceDto & { user?: any }) {
    return this.pushService.registerDevice(dto);
  }

  @MessagePattern({ cmd: ProjectJobs.NOTIFICATION.UNREGISTER_DEVICE })
  async unregisterDevice(dto: { token: string; user?: any }) {
    return this.pushService.unregisterDevice(dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @Get()
  list(@Query() query: ListNotificationsDto) {
    return this.notificationService.listNotifications(query);
  }

  @MessagePattern({ cmd: ProjectJobs.NOTIFICATION.REGISTER_WEB_PUSH })
  async registerWebPush(dto: SubscribeWebPushDto & { user?: any }) {
    return this.pushService.registerWebPush(dto);
  }

  @MessagePattern({ cmd: ProjectJobs.NOTIFICATION.UNREGISTER_WEB_PUSH })
  async unregisterWebPush(dto: { endpoint: string; user?: any }) {
    return this.pushService.unregisterWebPush(dto);
  }

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.pushService.getWebPushPublicKey() };
  }

  @MessagePattern({
    cmd: ProjectJobs.DISBURSEMENT_PLAN.SEND_EMAIL_NOTIFICATION,
  })

  async sendDisbursementEmailNotification(data: {
    actionType: 'INITIATED' | 'EXECUTED';
    projectId: string;
    disbursementId: string;
    disbursementType: 'INDIVIDUAL' | 'GROUP';
    amount: string;
    beneficiariesCount: number;
    network: string;
  }) {
    return this.notificationService.sendDisbursementEmailNotification(data);
  }
}
