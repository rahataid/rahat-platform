import { Inject, Injectable, Logger } from '@nestjs/common';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);
  private channelWrapper: ChannelWrapper;

  constructor(
    @Inject('AMQP_CONNECTION') private readonly connection: AmqpConnectionManager,
  ) {
    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertQueue('beneficiary-queue', { durable: true });
        this.logger.log('RabbitMQ channel and queue setup completed.');
      },
    });
  }

  // Publish a single message to a queue
  async publishToQueue(queue: string, message: any): Promise<void> {
    try {
      await this.channelWrapper.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      this.logger.log(`Message published to queue: ${queue}`);
    } catch (error) {
      this.logger.error(`Failed to publish message to queue ${queue}:`, error);
      throw error; // Rethrow to handle errors at the caller
    }
  }

  // Publish messages in batches to a queue
  async publishBatchToQueue(queue: string, messages: any[], batchSize = 10): Promise<void> {
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      try {
        await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
          await channel.assertQueue(queue, { durable: true });
          batch.forEach((msg) => {
            channel.sendToQueue(queue, Buffer.from(JSON.stringify({ data: msg, batchSize, batchIndex: i })), { persistent: true });
          });
        });
        this.logger.log(`Batch of ${batch.length} messages published to queue: ${queue}`);
      } catch (error) {
        this.logger.error(`Failed to publish batch to queue ${queue}:`, error);
      }
    }
  }
}
