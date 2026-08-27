import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '@rumsan/prisma';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './ability.constants';
import { AbilityController } from './ability.controller';
import { AbilityService } from './ability.service';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [AbilityController],
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) =>
                new Redis({
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                    password: configService.get<string>('REDIS_PASSWORD'),
                    lazyConnect: true,
                }),
        },
        AbilityService,
    ],
    exports: [AbilityService],
})
export class AbilityModule { }
