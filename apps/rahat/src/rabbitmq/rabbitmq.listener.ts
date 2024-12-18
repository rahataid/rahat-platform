import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller()
export class RabbitMQListener {
  @MessagePattern('example.event') // Listens to events with pattern 'example.event'
  handleEvent(@Payload() data: any, @Ctx() context: RmqContext) {
    context.getMessage()
    console.log('Received Event:', data, context.getMessage());
    // Add logic to process the event
  }

  @MessagePattern('example.rpc') // Handles RPC calls with pattern 'example.rpc'
  handleRpc(@Payload() data: any) {
    console.log('Received RPC:', data);
    // Respond to the RPC call
    return { message: 'Response from RabbitMQListener' };
  }
}
