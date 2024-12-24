import { Injectable, Logger } from '@nestjs/common';
import { ConfirmChannel, Connection } from 'amqplib';
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
  private isProcessingBatch = false;

  constructor(
    protected readonly queueUtilsService: QueueUtilsService,
    private readonly queueName: string,
    private readonly defaultBatchSize = 10,
    private readonly acknowledgeMode: 'individual' | 'batch' = 'individual',
    private readonly amqpConnection: Connection
  ) { }

  async initializeWorker(channel: ConfirmChannel): Promise<void> {
    this.channel = channel;

    this.channel.on('close', async () => {
      this.logger.warn('Channel closed. Reinitializing...');
      await this.reinitializeChannel();
    });

    this.channel.on('error', (error) => {
      this.logger.error('Channel error:', error);
    });

    try {
      await channel.prefetch(this.defaultBatchSize); // Limit unacknowledged messages
      await channel.assertQueue(this.queueName, { durable: true });
      this.logger.log(`Queue ${this.queueName} asserted successfully.`);

      await channel.consume(this.queueName, async (message) => {
        if (message) {
          const content = JSON.parse(message.content.toString());
          this.logger.debug(`Message received: ${JSON.stringify(content)}`);

          if (this.acknowledgeMode === 'batch') {
            this.batch.push({ data: content, message });
            if (!this.isProcessingBatch) {
              this.isProcessingBatch = true;
              await this.processBatchesSequentially();
            }
          } else {
            await this.processSingleMessage(content, message);
          }
        }
      });

      this.logger.log(`Worker initialized and consuming messages from ${this.queueName}`);
    } catch (error) {
      this.logger.error(`Error initializing worker for queue ${this.queueName}:`, error);
    }
  }

  private async processBatchesSequentially(): Promise<void> {
    while (this.batch.length >= this.defaultBatchSize) {
      const currentBatch = this.batch.splice(0, this.defaultBatchSize);
      await this.processBatch(currentBatch);
    }
    this.isProcessingBatch = false;
  }

  private async processBatch(batch: BatchItem<T>[]): Promise<void> {
    const dataBatch = batch.map((item) => item.data);
    const messageBatch = batch.map((item) => item.message);

    try {
      this.logger.debug(`Processing batch of size ${dataBatch.length}`);
      await this.processItem(dataBatch);

      for (const message of messageBatch) {
        this.channel.ack(message);
      }
      this.logger.debug(`Batch processed and acknowledged.`);
    } catch (error) {
      this.logger.error(`Error processing batch, requeueing messages.`, error);

      for (const message of messageBatch) {
        this.channel.nack(message, false, true);
      }
    }
  }

  private async processSingleMessage(content: any, message: any): Promise<void> {
    try {
      this.logger.debug(`Processing message: ${JSON.stringify(content)}`);
      await this.processItem(content);
      this.channel.ack(message);
      this.logger.debug(`Message processed and acknowledged.`);
    } catch (error) {
      this.logger.error(`Error processing message, requeuing.`, error);
      this.channel.nack(message, false, true);
    }
  }

  private async reinitializeChannel(): Promise<void> {
    try {
      const newChannel = await this.amqpConnection.createChannel();
      await this.initializeWorker(newChannel);
      this.logger.log('Channel reinitialized successfully.');
    } catch (error) {
      this.logger.error('Failed to reinitialize channel:', error);
    }
  }

  protected abstract processItem(items: T | T[]): Promise<void>;
}
