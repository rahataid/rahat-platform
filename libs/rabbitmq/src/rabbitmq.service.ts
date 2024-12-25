import { Global, Inject, Injectable, Logger } from '@nestjs/common';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

@Global()
@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);
  private channelWrapper: ChannelWrapper;

  constructor(
    @Inject('AMQP_CONNECTION') private readonly connection: AmqpConnectionManager,
    @Inject('QUEUE_NAMES') private readonly queuesToSetup: any[],
  ) {
    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        for (const queue of this.queuesToSetup) {
          await channel.assertQueue(queue.name, queue.options);
          this.logger.log(`Queue ${queue.name} setup completed.`);
        }
        this.logger.log('RabbitMQ channel and all queues setup completed.');
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
  async publishBatchToQueue(queue: string, messages: any[], batchSize = 10, otherData?: any, options?: any): Promise<void> {
    const queueOptions = this.queuesToSetup.find(q => q.name === queue)?.options;
    console.log('queueOptions', queueOptions);
    try {
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        try {
          await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
            await channel.assertQueue(queue, { durable: true });
            // batch.forEach(msg => {
            channel.sendToQueue(
              queue,
              Buffer.from(JSON.stringify({ data: batch, batchSize, batchIndex: i, ...otherData })),
              {
                persistent: true,
                ...queueOptions,
                ...options,
              },
            );
            // });
          });
        } catch (error) {
          this.logger.error(`Failed to publish batch to queue ${queue}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to publish batch to queue ${queue}:`, error);
    } finally {
      this.logger.log(
        `Total batch at the size of ${batchSize} published to queue ${queue}. Total messages: ${messages.length}  `,
      );
      this.logger.log(`Closing RabbitMQ channel for queue ${queue}`);
      this.channelWrapper.close();
    }
  }
}
