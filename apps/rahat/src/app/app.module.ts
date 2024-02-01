import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RumsanUsersModule } from '@rumsan/user';
import { PrismaModule } from '@rumsan/prisma';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ListenerModule } from '../listener/listener.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SettingsModule } from '@rumsan/settings';
import { BullModule } from '@nestjs/bull';
import { DebugProcessor, RahatProcessor } from '../processors';
import { EmailService } from '../utils/email.service';
import { SlackService } from '../utils/slack.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({ maxListeners: 10, ignoreErrors: false }),
    ListenerModule,
    RumsanUsersModule,
    SettingsModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DebugProcessor,
    RahatProcessor,
    EmailService,
    SlackService,
  ],
})
export class AppModule {}
