import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { createBatches } from '../utils/array';

@Injectable()
export class RabbitMQService {
  constructor(
    @Inject('rabbit-mq-module') private readonly client: ClientProxy,
  ) { }

  getClient() {
    return this.client;
  }

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

  async emitBulkInBatch(pattern: string, payloads: any[], batchSize = 100) {
    const batches = createBatches(payloads, batchSize);
    console.log(`Divided into ${batches.length} batches of size ${batchSize}`);

    for (const batch of batches) {
      console.log(`Sending batch:`, batch);
      this.client.emit(pattern, batch)
    }

    console.log('All batches sent successfully.');
  }
}
