import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SSE_EVENTS } from '../constants';
import { EventsController } from './events.controller';

@Module({
    imports: [ConfigModule],
    controllers: [EventsController],
    providers: [
        {
            provide: SSE_EVENTS.SUBSCIBER,
            useFactory: (config: ConfigService) =>
                new Redis({
                    host: config.get('REDIS_HOST'),
                    port: Number(config.get('REDIS_PORT')),
                    password: config.get('REDIS_PASSWORD'),
                }),
            inject: [ConfigService],
        },
    ],
})
export class EventsModule { }