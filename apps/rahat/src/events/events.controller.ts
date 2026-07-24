import { Controller, Inject, Logger, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { Observable } from 'rxjs';

@Controller('events')
@ApiTags('Events')

export class EventsController {
    private readonly logger = new Logger(EventsController.name);

    constructor(
        @Inject('REDIS_SUBSCRIBER') private readonly redis: Redis,
    ) { }

    @Sse('phases')
    phases(): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            this.logger.log('SSE client connected');

            const onMessage = (channel: string, message: string) => {
                if (channel === 'phase:events') {
                    subscriber.next({ data: message } as MessageEvent);
                }
            };

            this.redis.subscribe('phase:events');
            this.redis.on('message', onMessage);

            return () => {
                this.logger.log('SSE client disconnected');
                this.redis.unsubscribe('phase:events');
                this.redis.off('message', onMessage);
            };
        });
    }
}