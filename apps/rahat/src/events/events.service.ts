import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Observable } from 'rxjs';

const CHANNEL = 'phase:events';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly config: ConfigService) {}

  phases(): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const redis = new Redis({
        host: this.config.get<string>('REDIS_HOST'),
        port: Number(this.config.get('REDIS_PORT') || 6379),
        password: this.config.get<string>('REDIS_PASSWORD'),
        lazyConnect: true,
        retryStrategy: () => null,
      });

      const onMessage = (channel: string, message: string) => {
        if (channel === CHANNEL) subscriber.next({ data: message });
      };
      const onError = (error: Error) => {
        this.logger.error(`Phase event stream Redis error: ${error.message}`);
        subscriber.error(error);
      };

      redis.on('message', onMessage);
      redis.on('error', onError);
      this.logger.log('Phase event client connected');
      redis.subscribe(CHANNEL).catch(onError);

      return () => {
        redis.removeListener('message', onMessage);
        redis.removeListener('error', onError);
        redis.disconnect();
        this.logger.log('Phase event client disconnected');
      };
    });
  }
}
