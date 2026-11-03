import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SSE_CHANNELS } from '@rahataid/sdk';
import Redis from 'ioredis';
@Injectable()
export class SsePublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(SsePublisherService.name);
  private readonly redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis({
      host: configService.get<string>('REDIS_HOST'),
      port: Number(configService.get<number>('REDIS_PORT')),
      password: configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async publishEvent(event: string, data: unknown): Promise<void> {
    const message = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    });
    try {
      await this.redis.publish(
        SSE_CHANNELS.LISTENER,
        message
      );
    } catch (error) {
      const details = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Failed to publish SSE event "${event}"`, details);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
