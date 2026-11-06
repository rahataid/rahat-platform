import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CheckHeaders, ExternalAppGuard } from '../decorators';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('connect/session')
  @UseGuards(ExternalAppGuard)
  @CheckHeaders('Signature')
  async connectSession(@Body() payload: Record<string, any>) {
    return this.webhooksService.forwardConnectSessionWebhook(payload);
  }
}
