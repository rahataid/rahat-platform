import { Injectable, Logger } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class QueueUtilsService {
  private readonly logger = new Logger(QueueUtilsService.name);

  // Process a batch of items with individual error handling
  async processBatch<T>(items: T[], processor: (item: T) => Promise<void>): Promise<void> {
    for (const item of items) {
      try {
        await processor(item);
      } catch (error) {
        this.logger.error(`Error processing item: ${JSON.stringify(item)} - Error:`, error);
      }
    }
  }

  // Process items with manual acknowledgment and optional negative acknowledgment
  async processItemsWithAck<T>(
    items: T[],
    processor: (item: T) => Promise<void>,
    ack: (item: T) => void,
    nack?: (item: T) => void
  ): Promise<void> {
    for (const item of items) {
      try {
        await processor(item);
        ack(item);
      } catch (error) {
        this.logger.error(`Error processing item: ${JSON.stringify(item)} - Error:`, error);
        if (nack) nack(item);
      }
    }
  }

  // Acknowledge a batch of messages
  async acknowledgeBatch(channel: ConfirmChannel, deliveryTags: number[], multiple = false): Promise<void> {
    try {
      deliveryTags.forEach((tag) => channel.ack({ deliveryTag: tag }, multiple));
      this.logger.log(`Batch acknowledgment sent for delivery tags: ${deliveryTags}`);
    } catch (error) {
      this.logger.error(`Error during batch acknowledgment:`, error);
    }
  }

  // Requeue a message with optional delay
  async requeueMessage(
    channel: ConfirmChannel,
    message: any,
    delay: number = 0
  ): Promise<void> {
    try {
      if (delay > 0) {
        setTimeout(() => channel.nack(message, false, true), delay);
      } else {
        channel.nack(message, false, true);
      }
      this.logger.log(`Message requeued with delay ${delay}ms: ${JSON.stringify(message)}`);
    } catch (error) {
      this.logger.error(`Error during message requeueing:`, error);
    }
  }

  // Set channel prefetch
  async setChannelPrefetch(channel: ConfirmChannel, prefetch: number): Promise<void> {
    try {
      await channel.prefetch(prefetch);
      this.logger.log(`Channel prefetch set to ${prefetch}`);
    } catch (error) {
      this.logger.error(`Error setting channel prefetch:`, error);
    }
  }

  // Handle redelivery
  async handleRedelivery(message: any, processor: (item: any) => Promise<void>): Promise<void> {
    const isRedelivered = message.properties.redelivered;
    try {
      if (isRedelivered) {
        this.logger.warn(`Redelivered message detected: ${JSON.stringify(message)}`);
      }
      await processor(message);
    } catch (error) {
      this.logger.error(`Error processing redelivered message: ${JSON.stringify(message)} - Error:`, error);
    }
  }
}
