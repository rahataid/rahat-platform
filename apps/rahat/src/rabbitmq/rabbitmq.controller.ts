
import { Controller, Get } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Controller('rabbitmq')
export class RabbitMQController {
  constructor(private readonly rabbitMQService: RabbitMQService) { }

  @Get('emit')
  async emitMessage() {
    const data = { message: 'Hello RabbitMQ!' };
    await this.rabbitMQService.emitMessage('example.event', data);
    return 'Message emitted!';
  }

  @Get('send')
  async sendMessage() {
    const data = { message: 'Hello RabbitMQ!' };
    const response = await this.rabbitMQService.sendMessage('example.rpc', data);
    return { response };
  }
}
