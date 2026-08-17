import { Controller, Inject, Logger, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { Observable } from 'rxjs';
import { REDIS_CHANNELS, SSE_EVENTS } from '../constants';

@Controller('events')
@ApiTags('Events')

export class EventsController {
    private readonly logger = new Logger(EventsController.name);

    constructor(
        @Inject(SSE_EVENTS.SUBSCIBER) private readonly redis: Redis,
    ) { }

    @Sse()
    events(): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            this.logger.log('SSE client connected');

            const onMessage = (channel: string, message: string) => {
                subscriber.next({ data: message } as MessageEvent);
            };

            this.redis.subscribe(REDIS_CHANNELS.SSE_LISTENER);
            this.redis.on('message', onMessage);

            return () => {
                this.logger.log('SSE client disconnected');
                this.redis.unsubscribe(REDIS_CHANNELS.SSE_LISTENER);
                this.redis.off('message', onMessage);
            };
        });
    }

}