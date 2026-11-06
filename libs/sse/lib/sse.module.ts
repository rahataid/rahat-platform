import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SSE_EVENTS } from './sse.constants';
import { SsePublisherService } from './sse.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SSE_EVENTS.PUBLISHER,
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.get<string>('REDIS_HOST'),
          port: Number(config.get<number>('REDIS_PORT')),
          password: config.get<string>('REDIS_PASSWORD'),
        }),
      inject: [ConfigService],
    },
    SsePublisherService,
  ],
  exports: [SsePublisherService],
})
export class SseModule {}
