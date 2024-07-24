import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StatsModule } from '@rahat/stats';
import { SettingsModule } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import {
  AuthsModule,
  RSUserModule,
  RolesModule,
  UsersModule,
} from '@rumsan/user';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module';
import { GrievanceModule } from '../grievance/grievance.module';
import { ListenersModule } from '../listeners/listeners.module';
import { ProcessorsModule } from '../processors/processors.module';
import { ProjectModule } from '../projects/projects.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { TokenModule } from '../token/token.module';
import { UploadModule } from '../upload/upload.module';
import { AppUsersModule } from '../vendors/vendors.module';
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
    AppUsersModule,
    RSUserModule.forRoot([AuthsModule, UsersModule, RolesModule]),
    ProjectModule,
    StatsModule,
    ProcessorsModule,
    UploadModule,
    GrievanceModule,
    TokenModule,
    SettingsModule,
    RequestContextModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
