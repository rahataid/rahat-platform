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
        // Setup logic if needed
      },
    });
  }

  // Publish a message
  async publishToQueue(queue: string, message: any): Promise<void> {
    try {
      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        this.logger.log(`Message published to queue: ${queue}`);
      });
    } catch (error) {
      this.logger.error(`Failed to publish message to queue ${queue}:`, error);
    }
  }

  // Publish messages in batches
  async publishBatchToQueue(queue: string, messages: any[], batchSize = 10): Promise<void> {
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      try {
        await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
          await channel.assertQueue(queue, { durable: true });
          batch.forEach((msg, i) => channel.sendToQueue(queue, { ...msg, i }));
        });
        this.logger.log(`Batch of ${batch.length} messages published to queue: ${queue}`);
      } catch (error) {
        this.logger.error(`Failed to publish batch to queue ${queue}:`, error);
      }
    }
  }
}
