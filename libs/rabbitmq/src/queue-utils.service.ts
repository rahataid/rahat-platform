import { Injectable, Logger } from '@nestjs/common';
import { Channel } from 'amqplib';

@Injectable()
export class QueueUtilsService {
  private readonly logger = new Logger(QueueUtilsService.name);

  // Process items in batches with individual error handling
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
    nack?: (item: T) => void,
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

  // Set channel prefetch
  async setChannelPrefetch(channel: Channel, prefetch: number): Promise<void> {
    try {
      await channel.prefetch(prefetch);
      this.logger.log(`Channel prefetch set to ${prefetch}`);
    } catch (error) {
      this.logger.error(`Error setting channel prefetch:`, error);
    }
  }

  // Handle message requeue with optional delay
  async requeueMessage(channel: Channel, message: any, delay = 0): Promise<void> {
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
}
