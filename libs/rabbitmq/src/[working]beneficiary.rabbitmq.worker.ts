import { Global, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { QueueUtilsService } from './queue-utils.service';

@Global()
@Injectable()
export class BeneficiaryWorker implements OnModuleInit {
  private readonly logger = new Logger(BeneficiaryWorker.name);
  private batch: any[] = [];
  private batchSize = 20; // Set batch size here
  private processing = false; // State flag to track processing
  private channel: ConfirmChannel;

  constructor(
    @Inject('AMQP_CONNECTION') private readonly connection: AmqpConnectionManager,
    private readonly queueUtilsService: QueueUtilsService
  ) { }

  async onModuleInit() {
    try {
      const channelWrapper: ChannelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: ConfirmChannel) => {
          this.channel = channel;

          // Set prefetch to batch size for controlling delivery rate
          await channel.prefetch(this.batchSize);
          this.logger.log(`Channel prefetch set to ${this.batchSize}.`);

          await channel.assertQueue('beneficiary-queue', { durable: true });
          await channel.consume('beneficiary-queue', async (message) => {
            if (message) {
              const data = JSON.parse(message.content.toString());
              this.logger.log(`Received message: ${JSON.stringify(data)}`);
              this.batch.push({ data, message });

              // If batch size is met and no processing is ongoing, process the batch
              if (this.batch.length >= this.batchSize && !this.processing) {
                this.processing = true; // Set processing flag to true
                await this.processBatch();
              }
            }
          });
        },
      });

      this.logger.log('Beneficiary Worker initialized.');
    } catch (err) {
      this.logger.error('Error initializing Beneficiary Worker:', err);
    }
  }

  private async processBatch() {
    const batch = this.batch.splice(0, this.batchSize); // Extract the batch
    const dataBatch = batch.map(item => item.data);
    const messageBatch = batch.map(item => item.message);

    try {
      this.logger.log(`Starting batch processing of ${dataBatch.length} items...`);

      await this.queueUtilsService.processBatch(dataBatch, async (item) => {
        this.logger.log(`Processing beneficiary: ${JSON.stringify(item)}`);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async processing
        this.logger.log(`Beneficiary processed: ${JSON.stringify(item)}`);
      });

      this.logger.log('Batch processing completed.');

      // Acknowledge all messages in the batch
      messageBatch.forEach((message) => this.channel.ack(message));
      this.logger.log('Batch acknowledged.');
    } catch (error) {
      this.logger.error('Error processing batch:', error);

      // Requeue messages if batch processing fails
      messageBatch.forEach((message) => this.channel.nack(message, false, true));
      this.logger.log('Batch requeued.');
    } finally {
      this.processing = false; // Reset processing flag
      if (this.batch.length > 0) {
        // Process next batch if available
        this.logger.log(`Remaining messages in queue: ${this.batch.length}`);
        await this.processBatch();
      }
    }
  }
}

