import { Body, Controller, Post } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('connect/session')
  async connectSession(@Body() payload: Record<string, any>) {
    return this.webhooksService.forwardConnectSessionWebhook(payload);
  }
}
