// src/modules/rabbitmq/rabbitmq.listener.ts
import { Controller, OnModuleInit } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller()
export class RabbitMQListener implements OnModuleInit {
  private isListenerInitialized = false;

  async onModuleInit() {
    console.log('RabbitMQ Listener initialized.');
    this.isListenerInitialized = true;
  }

  @MessagePattern('example.event') // Listens to events with pattern 'example.event'
  handleEvent(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    console.log('Received Event:', data);

    channel.ack(originalMsg); // Acknowledge the message
  }

  @MessagePattern('beneficiary.bulk_add.event')
  handleAddBulkBeneficiaries(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    console.log('Processing bulk beneficiaries:', data);
    channel.ack(originalMsg);

    return { message: 'Processed bulk beneficiaries' };
  }
}
