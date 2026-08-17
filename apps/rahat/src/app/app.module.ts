// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StatsModule } from '@rahat/stats';
import { SettingsModule } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import {
  AbilityModule,
  AuthsModule,
  RSUserModule,
  RolesModule,
  UsersModule
} from '@rumsan/user';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module';
import { CommsModule } from '../comms/comms.module';
import { ExternalAppGuard } from '../decorators';
import { EventsModule } from '../events/events.module';
import { GrievanceModule } from '../grievance/grievance.module';
import { ImportsModule } from '../imports/imports.module';
import { ListenersModule } from '../listeners/listeners.module';
import { NotificationModule } from '../notification/notification.module';
import { OfframpModule } from '../offramp/offramp.module';
import { OtpModule } from '../otp/otp.module';
import { MetaTxnProcessorsModule } from '../processors/meta-transaction/metaTransaction.module';
import { ProcessorsModule } from '../processors/processors.module';
import { ProjectModule } from '../projects/projects.module';
import { QueueModule } from '../queue/queue.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { TokenModule } from '../token/token.module';
import { UploadModule } from '../upload/upload.module';
import { AppUsersModule } from '../vendors/vendors.module';
import { WalletModule } from '../wallet/wallet.module';
import { ABILITY_ACTIONS, ABILITY_SUBJECTS } from './app.constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthClientModule } from './auth-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthClientModule,
    BeneficiaryModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
        settings: {
          stalledInterval: 30000, // Time (ms) to check for stalled jobs, default is 30 seconds.
          lockDuration: 60000, // Time (ms) for a job to finish before considering it stalled, default is 30 seconds.
        },
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({ maxListeners: 10, ignoreErrors: false, verboseMemoryLeak: false }),
    ListenersModule,
    AppUsersModule,
    OtpModule,
    RSUserModule.forRoot([AuthsModule, UsersModule, RolesModule]),
    ProjectModule,
    StatsModule,
    ProcessorsModule,
    MetaTxnProcessorsModule,
    UploadModule,
    ImportsModule,
    GrievanceModule,
    TokenModule,
    SettingsModule,
    OfframpModule,
    RequestContextModule,
    QueueModule,
    WalletModule,
    NotificationModule,
    EventsModule,
    CommsModule.forRoot(),
    AbilityModule.forRoot({ subjects: ABILITY_SUBJECTS, actions: ABILITY_ACTIONS }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ExternalAppGuard,
    },
  ],
  exports: [AppService]
})
export class AppModule { }
