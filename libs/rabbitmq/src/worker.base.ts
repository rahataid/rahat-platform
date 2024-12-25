import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';
import { QueueUtilsService } from './queue-utils.service';
import { RabbitMQModuleOptions } from './types';

export interface BatchItem<T> {
  data: T;
  message: any;
}

@Injectable()
export abstract class BaseWorker<T> implements OnModuleDestroy {
  protected readonly logger = new Logger(this.constructor.name);
  private channel: ConfirmChannel;
  private static workerCount = 0; // Track active worker instances
  private readonly workerId: number;
  private readonly queueName: string; // Declare queueName here

  constructor(
    protected readonly queueUtilsService: QueueUtilsService,
    queueName: string,
    private readonly defaultBatchSize = 10,
    private readonly acknowledgeMode: 'individual' | 'batch' = 'individual',
    private readonly amqpConnection: any,
    private readonly queueArguments: RabbitMQModuleOptions['queues'][0]['options']['arguments'] = {},
  ) {
    this.queueName = queueName;
    BaseWorker.workerCount++;
    this.workerId = BaseWorker.workerCount;
    this.logger.log(
      `${this.queueName} - Worker instance created. ${this.queueName} - Worker ID: ${this.workerId}. Total workers: ${BaseWorker.workerCount}`,
    );
  }

  async initializeWorker(channel: ConfirmChannel): Promise<void> {
    this.channel = channel;

    this.channel.on('close', async () => {
      this.logger.warn(
        `${this.queueName} - Worker ID: ${this.workerId} - Channel closed. Reinitializing...`,
      );
    });

    this.channel.on('error', error => {
      this.logger.error(`${this.queueName} - Worker ID: ${this.workerId} - Channel error:`, error);
    });

    try {
      this.logger.log(
        `${this.queueName} - Worker ID: ${this.workerId} - Setting prefetch to ${this.defaultBatchSize}.`,
      );
      await this.channel.prefetch(this.defaultBatchSize);

      const queueArgsMatch = await this.ensureQueueArguments();

      if (!queueArgsMatch) {
        this.logger.error(
          `${this.queueName} - Worker ID: ${this.workerId} - Queue arguments conflict detected. Manual intervention required.`,
        );
        return;
      }

      this.logger.log(
        `${this.queueName} - Worker ID: ${this.workerId} - Queue ${this.queueName} is ready.`,
      );

      let batch: BatchItem<T>[] = [];

      await this.channel.consume(this.queueName, async message => {
        if (message) {
          const content = JSON.parse(message.content.toString());
          batch.push({ data: content, message });

          this.logger.log(
            `${this.queueName} - Worker ID: ${this.workerId} - Received message: ${JSON.stringify(
              content,
            )}`,
          );

          if (batch.length >= this.defaultBatchSize || this.acknowledgeMode === 'individual') {
            const currentBatch = [...batch];
            batch = []; // Reset batch
            this.logger.log(
              `${this.queueName} - Worker ID: ${this.workerId} - Processing batch of size: ${currentBatch.length}.`,
            );
            await this.processBatch(currentBatch);
          }
        }
      });

      this.logger.log(
        `${this.queueName} - Worker ID: ${this.workerId} - Worker initialized and consuming messages from ${this.queueName}`,
      );
    } catch (error) {
      this.logger.error(
        `${this.queueName} - Worker ID: ${this.workerId} - Error initializing worker for queue ${this.queueName}: `,
        error,
      );
    }
  }

  private async ensureQueueArguments(): Promise<boolean> {
    try {
      const existingArgs = this.queueArguments;

      console.log('first', this.queueArguments);

      if (JSON.stringify(existingArgs) !== JSON.stringify(this.queueArguments)) {
        this.logger.error(
          `${this.queueName} - Worker ID: ${this.workerId
          } - Queue arguments conflict: Existing = ${JSON.stringify(
            existingArgs,
          )
          }, Provided = ${JSON.stringify(this.queueArguments)} `,
        );

        if (process.env.FORCE_QUEUE_RESET === 'true') {
          this.logger.warn(
            `${this.queueName} - Worker ID: ${this.workerId} - Force resetting queue due to argument conflicts.`,
          );
          await this.channel.deleteQueue(this.queueName);
          await this.channel.assertQueue(this.queueName, {
            durable: true,
            arguments: this.queueArguments,
          });
          this.logger.log(
            `${this.queueName} - Worker ID: ${this.workerId} - Queue "${this.queueName}" recreated successfully.`,
          );
          return true;
        }

        return false;
      }

      this.logger.log(
        `${this.queueName} - Worker ID: ${this.workerId} - Queue "${this.queueName}" exists with matching arguments.`,
      );
      return true;
    } catch (error) {
      if (error.message.includes('NOT_FOUND')) {
        this.logger.warn(
          `${this.queueName} - Worker ID: ${this.workerId} - Queue "${this.queueName}" not found.Creating...`,
        );
        await this.channel.assertQueue(this.queueName, {
          durable: true,
          arguments: this.queueArguments,
        });
        this.logger.log(
          `${this.queueName} - Worker ID: ${this.workerId} - Queue "${this.queueName}" created successfully.`,
        );
        return true;
      }
      throw error;
    }
  }

  private async processBatch(batch: BatchItem<T>[]): Promise<void> {
    for (const item of batch) {
      try {
        this.logger.log(
          `${this.queueName} - Worker ID: ${this.workerId} - Processing item: ${JSON.stringify(
            item.data,
          )
          }.`,
        );
        await this.processItem(item.data);
        this.channel.ack(item.message);
        this.logger.log(
          `${this.queueName} - Worker ID: ${this.workerId} - Message processed and acknowledged: .`,
        );
      } catch (error) {
        this.logger.error(
          `${this.queueName} - Worker ID: ${this.workerId
          } - Error processing message, requeuing: ${JSON.stringify(item.data)}`,
          error,
        );
        this.channel.nack(item.message, false, true);
      }
    }
  }

  protected abstract processItem(items: T | T[]): Promise<void>;

  onModuleDestroy() {
    BaseWorker.workerCount--;
    this.logger.warn(
      `${this.queueName} - Worker ID: ${this.workerId} shutting down.Remaining workers: ${BaseWorker.workerCount}`,
    );
  }
}
