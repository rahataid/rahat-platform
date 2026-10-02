// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
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
    ClientsModule.register([
      {
        name: ProjectContants.ELClient,
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT ?? 0),
          password: process.env.REDIS_PASSWORD,
        },
      },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthController],
  providers: [HealthService, PrismaService, Logger, EmailService, HealthCron],
  exports: [HealthService],
})
export class HealthModule {}
