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
    private readonly defaultBatchSize = 10
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
      this.logger.log(`Processing batch of size ${batchSize}`);
      await this.queueUtilsService.processItemsWithAck(
        dataBatch,
        async (item) => await this.processItem(item),
        (item) => {
          try {
            const message = messageBatch.find(
              (m) => JSON.stringify(item) === JSON.stringify(JSON.parse(m.content.toString()).data)
            );
            if (message) {
              this.channel.ack(message);
              this.logger.log(`Acknowledged message: ${JSON.stringify(item)}`);
            }
          } catch (error) {
            this.logger.error(`Error acknowledging message: ${JSON.stringify(item)} - ${error}`);
          }
        },
        (item) => {
          try {
            const message = messageBatch.find(
              (m) => JSON.stringify(item) === JSON.stringify(JSON.parse(m.content.toString()).data)
            );
            if (message) {
              this.channel.nack(message, false, true); // Requeue the message
              this.logger.warn(`Nacked and requeued message: ${JSON.stringify(item)}`);
            }
          } catch (error) {
            this.logger.error(`Error negatively acknowledging message: ${JSON.stringify(item)} - ${error}`);
          }
        }
      );
      this.logger.log(`Batch of size ${batchSize} processed successfully.`);
    } catch (error) {
      this.logger.error(`Error processing batch of size ${batchSize}:`, error);
      for (const message of messageBatch) {
        try {
          this.channel.nack(message, false, true); // Requeue on failure
          this.logger.warn(`Message requeued due to batch processing error: ${message}`);
        } catch (nackError) {
          this.logger.error(`Failed to nack message during batch error handling: ${nackError}`);
        }
      }
    }
  }


  protected abstract processItem(item: T): Promise<void>; // Abstract for business logic
}

