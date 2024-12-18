import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitMQService {
  constructor(
    @Inject('rabbit-mq-module') private readonly client: ClientProxy,
  ) { }

  // Emit a message (fire-and-forget)
  async emitMessage(pattern: string, payload: any) {
    console.log(`Sending event to RabbitMQ with pattern: ${pattern}`, payload);
    return this.client.emit(pattern, payload).toPromise();
  }

  // Send a message and receive a response
  async sendMessage(pattern: string, payload: any) {
    console.log(`Sending RPC request to RabbitMQ with pattern: ${pattern}`, payload);
    return this.client.send(pattern, payload).toPromise();
  }
}
