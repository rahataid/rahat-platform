import { Injectable, Logger } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';
import { QueueUtilsService } from './queue-utils.service';

export interface BatchItem<T> {
  data: T;
  message: any;
}

@Injectable()
export abstract class BaseWorker<T> {
  protected readonly logger = new Logger(this.constructor.name);
  private batch: BatchItem<T>[] = [];
  private channel: ConfirmChannel;

  constructor(
    protected readonly queueUtilsService: QueueUtilsService,
    private readonly queueName: string,
    private readonly defaultBatchSize = 10,
    private readonly acknowledgeMode: 'individual' | 'batch' = 'individual' // Default mode
  ) { }

  async initializeWorker(channel: ConfirmChannel): Promise<void> {
    this.channel = channel;

    try {
      await channel.assertQueue(this.queueName, { durable: true });
      this.logger.log(`Queue ${this.queueName} asserted successfully.`);

      await channel.consume(this.queueName, async (message) => {
        if (message) {
          const content = JSON.parse(message.content.toString());
          const batchSize = content.batchSize || this.defaultBatchSize;

          this.logger.log(`Message received: ${JSON.stringify(content)}`);
          this.batch.push({ data: content.data, message });

          if (this.batch.length >= batchSize) {
            await this.processBatch(batchSize);
          }
        }
      });

      this.logger.log(`Worker initialized and consuming messages from ${this.queueName}`);
    } catch (error) {
      this.logger.error(`Error initializing worker for queue ${this.queueName}:`, error);
    }
  }

  private async processBatch(batchSize: number): Promise<void> {
    const batch = this.batch.splice(0, batchSize);
    const dataBatch = batch.map((item) => item.data);
    const messageBatch = batch.map((item) => item.message);

    try {
      this.logger.log(`Processing batch of size ${batchSize} with items: ${JSON.stringify(dataBatch)}`);
      await this.processItem(dataBatch);

      if (this.acknowledgeMode === 'batch') {
        // Acknowledge the last message in the batch to confirm the entire batch
        const lastMessage = messageBatch[messageBatch.length - 1];
        if (lastMessage) {
          this.channel.ack(lastMessage, true);
          this.logger.log(`Batch of size ${batchSize} acknowledged successfully.`);
        }
      } else {
        // Acknowledge messages individually
        messageBatch.forEach((message) => {
          try {
            this.channel.ack(message);
          } catch (error) {
            this.logger.error(`Error acknowledging message: ${JSON.stringify(message)} - ${error}`);
          }
        });
        this.logger.log(`Batch of size ${batchSize} processed and acknowledged individually.`);
      }
    } catch (error) {
      this.logger.error(`Error processing batch of size ${batchSize}:`, error);

      // Requeue messages based on acknowledgment mode
      if (this.acknowledgeMode === 'batch') {
        const lastMessage = messageBatch[messageBatch.length - 1];
        if (lastMessage) {
          try {
            this.channel.nack(lastMessage, true, true);
            this.logger.warn(`Batch of size ${batchSize} negatively acknowledged and requeued.`);
          } catch (nackError) {
            this.logger.error(`Failed to nack batch during error handling: ${nackError}`);
          }
        }
      } else {
        messageBatch.forEach((message) => {
          try {
            this.channel.nack(message, false, true);
          } catch (nackError) {
            this.logger.error(`Failed to nack message during batch error handling: ${nackError}`);
          }
        });
      }
    }
  }

  protected abstract processItem(items: T[]): Promise<void>; // Abstract for business logic
}
