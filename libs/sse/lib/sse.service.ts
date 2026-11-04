import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { SSE_CHANNELS } from '@rahataid/sdk';
import Redis from 'ioredis';
import { SSE_EVENTS } from './sse.constants';

@Injectable()
export class SsePublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(SsePublisherService.name);

  constructor(@Inject(SSE_EVENTS.PUBLISHER) private readonly redis: Redis) {}

  async publishEvent(event: string, data: unknown): Promise<void> {
    const message = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    try {
      await this.redis.publish(SSE_CHANNELS.LISTENER, message);
    } catch (error) {
      const details = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Failed to publish SSE event "${event}"`, details);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
