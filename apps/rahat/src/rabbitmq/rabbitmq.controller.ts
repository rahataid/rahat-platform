
import { Controller, Get } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Controller('rabbitmq')
export class RabbitMQController {
  constructor(private readonly rabbitMQService: RabbitMQService) { }

  @Get('emit')
  async emitMessage() {
    const data = {
      name: 'John Doe',
      email: ''
    };
    const dataBatched = Array(10000).fill(data).map((item, index) => ({
      name: item.name + index, email: `email@${index}.com`
    }));
    console.log('dataBatched', dataBatched)
    await this.rabbitMQService.publishBatchToQueue('beneficiary-queue', dataBatched, 100);
    return 'Message emitted!';
  }

  @Get('send')
  async sendMessage() {
    const data = { message: 'Hello RabbitMQ!' };
    const response = await this.rabbitMQService.publishBatchToQueue('example.rpc', [data], 1);
    return { response };
  }


}
