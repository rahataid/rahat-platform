// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { AuthsModule } from '@rumsan/user';
import { EmailService } from '../listeners/email.service';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthCron } from './health.cron';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    BullModule.registerQueue({ name: BQUEUE.RAHAT }),
    AuthsModule,
    ClientsModule.registerAsync([
      {
        name: ProjectContants.ELClient,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: configService.get('REDIS_HOST'),
            port: Number(configService.get('REDIS_PORT') ?? 0),
            password: configService.get('REDIS_PASSWORD'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthController],
  providers: [HealthService, PrismaService, Logger, EmailService, HealthCron],
  exports: [HealthService],
})
export class HealthModule {}
