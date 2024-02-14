import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StatsModule } from '@rahat/stats';
import { PrismaModule } from '@rumsan/prisma';
import { SettingsModule } from '@rumsan/settings';
import { RumsanUsersModule } from '@rumsan/user';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module';
import { ListenersModule } from '../listeners/listeners.module';
import { RahatProcessor } from '../processors';
import { ProjectModule } from '../projects/projects.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BeneficiaryModule,
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
    ListenersModule,
    RumsanUsersModule,
    SettingsModule,
    PrismaModule,
    ProjectModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RahatProcessor],
})
export class AppModule {}
